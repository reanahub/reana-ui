/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { NON_DELETED_STATUSES } from "~/config";
import {
  parseWorkflowListQuery,
  serializeQueryToApiParams,
  WORKFLOW_LIST_DEFAULT_PAGE_SIZE,
  WORKFLOW_LIST_DEFAULT_SORT,
} from "./workflowListQuery";

const parseQuery = (queryString) =>
  parseWorkflowListQuery(new URLSearchParams(queryString));

const serializeQueryString = (queryString) =>
  serializeQueryToApiParams(parseQuery(queryString));

describe("parseWorkflowListQuery", () => {
  it("defaults to your workflows with no sharing refinement", () => {
    const query = parseQuery("");

    expect(query).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: WORKFLOW_LIST_DEFAULT_PAGE_SIZE,
        category: "mine",
        ownedBy: undefined,
        sharedWith: undefined,
      }),
    );
    expect(serializeQueryToApiParams(query)).toEqual(
      expect.objectContaining({
        shared: false,
        sharedBy: undefined,
        sharedWith: undefined,
        status: NON_DELETED_STATUSES,
      }),
    );
  });

  it("supports legacy shared=true as shared workflows", () => {
    const query = parseQuery("shared=true");

    expect(query).toEqual(
      expect.objectContaining({
        category: "shared-with-me",
        ownedBy: "anybody",
        sharedWith: undefined,
      }),
    );
    expect(serializeQueryToApiParams(query)).toEqual(
      expect.objectContaining({
        shared: false,
        sharedBy: "anybody",
        sharedWith: undefined,
      }),
    );
  });

  it("supports private owned workflows", () => {
    expect(serializeQueryString("shared-with=nobody")).toEqual(
      expect.objectContaining({
        shared: false,
        sharedBy: undefined,
        sharedWith: "nobody",
      }),
    );
  });

  it("supports legacy shared-with=true as shared with anybody", () => {
    const query = parseQuery("shared-with=true");

    expect(query).toEqual(
      expect.objectContaining({
        category: "mine",
        ownedBy: undefined,
        sharedWith: "anybody",
      }),
    );
    expect(serializeQueryToApiParams(query)).toEqual(
      expect.objectContaining({
        shared: false,
        sharedBy: undefined,
        sharedWith: "anybody",
      }),
    );
  });

  it("lets shared-with take priority over owned-by", () => {
    const query = parseQuery("owned-by=you&shared-with=alice@example.org");

    expect(query).toEqual(
      expect.objectContaining({
        category: "mine",
        ownedBy: undefined,
        sharedWith: "alice@example.org",
      }),
    );
    expect(serializeQueryToApiParams(query)).toEqual(
      expect.objectContaining({
        shared: false,
        sharedBy: undefined,
        sharedWith: "alice@example.org",
      }),
    );
  });

  it("supports legacy shared-by as owned-by", () => {
    expect(serializeQueryString("shared-by=alice@example.org")).toEqual(
      expect.objectContaining({
        shared: false,
        sharedBy: "alice@example.org",
        sharedWith: undefined,
      }),
    );
  });

  it("resets page when dropping legacy status=deleted", () => {
    const query = parseQuery("status=deleted&page=2");

    expect(query).toEqual(
      expect.objectContaining({
        page: 1,
        status: undefined,
        hasStatusFilter: false,
      }),
    );
    expect(serializeQueryToApiParams(query)).toEqual(
      expect.objectContaining({
        pagination: {
          page: 1,
          size: WORKFLOW_LIST_DEFAULT_PAGE_SIZE,
        },
        status: NON_DELETED_STATUSES,
      }),
    );
  });

  it.each([
    ["asc", "asc"],
    ["cpu-desc", "cpu-desc"],
    ["unexpected", WORKFLOW_LIST_DEFAULT_SORT],
    ["", WORKFLOW_LIST_DEFAULT_SORT],
  ])("normalizes ?sort=%s to %s", (rawSort, expected) => {
    expect(parseQuery(`sort=${rawSort}`).sort).toBe(expected);
  });
});

describe("serializeQueryToApiParams", () => {
  it.each([
    {
      name: "no status filter hides deleted runs",
      queryString: "",
      status: NON_DELETED_STATUSES,
    },
    {
      name: "no status filter with deleted runs included asks for every status",
      queryString: "show-deleted=true",
      status: undefined,
    },
    {
      name: "a status filter narrows to that status",
      queryString: "status=running",
      status: ["running"],
    },
    {
      name: "a status filter including deleted runs asks for both",
      queryString: "status=running&show-deleted=true",
      status: ["running", "deleted"],
    },
    {
      name: "an invalid status is ignored, so deleted runs widen to every status",
      queryString: "status=unexpected&show-deleted=true",
      status: undefined,
    },
  ])("$name", ({ queryString, status }) => {
    expect(serializeQueryString(queryString).status).toEqual(status);
  });

  it("requests only interactive workflows for open sessions", () => {
    expect(serializeQueryString("open-sessions=true")).toEqual(
      expect.objectContaining({ type: "interactive" }),
    );
    expect(serializeQueryString("")).not.toHaveProperty("type");
  });
});
