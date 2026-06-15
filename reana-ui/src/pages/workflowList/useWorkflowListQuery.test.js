/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

import { useWorkflowListQuery } from "./useWorkflowListQuery";

const routerFutureFlags = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
};

const wrapper = ({ children }) => (
  <MemoryRouter future={routerFutureFlags}>{children}</MemoryRouter>
);
const wrapperWithEntry = (entry) =>
  function Wrapper({ children }) {
    return (
      <MemoryRouter future={routerFutureFlags} initialEntries={[entry]}>
        {children}
      </MemoryRouter>
    );
  };

const renderWithLocation = (entry) =>
  renderHook(
    () => ({
      workflowList: useWorkflowListQuery(),
      location: useLocation(),
    }),
    { wrapper: wrapperWithEntry(entry) },
  );

test("selects an owned-workflow sharing refinement", async () => {
  const { result } = renderHook(() => useWorkflowListQuery(), { wrapper });

  act(() => result.current.setSharing(undefined, "anybody"));

  await waitFor(() => {
    expect(result.current.query.sharedWith).toBe("anybody");
  });
  expect(result.current.query.ownedBy).toBeUndefined();
  expect(result.current.requestParams.shared).toBe(false);
});

test("selects private owned workflows", async () => {
  const { result } = renderHook(() => useWorkflowListQuery(), { wrapper });

  act(() => result.current.setSharing(undefined, "nobody"));

  await waitFor(() => {
    expect(result.current.query.sharedWith).toBe("nobody");
  });
  expect(result.current.query.ownedBy).toBeUndefined();
  expect(result.current.requestParams).toMatchObject({
    shared: false,
    sharedBy: undefined,
    sharedWith: "nobody",
  });
});

test("switching tabs clears incompatible sharing refinements", async () => {
  const { result } = renderHook(() => useWorkflowListQuery(), {
    wrapper: wrapperWithEntry("/?shared-with=alice@example.org&page=3"),
  });

  act(() => result.current.setSharing("anybody", undefined));

  await waitFor(() => {
    expect(result.current.query.ownedBy).toBe("anybody");
    expect(result.current.query.sharedWith).toBeUndefined();
    expect(result.current.query.page).toBe(1);
  });
  expect(result.current.query.category).toBe("shared-with-me");
  expect(result.current.requestParams).toMatchObject({
    shared: false,
    sharedBy: "anybody",
    sharedWith: undefined,
  });

  act(() => result.current.setSharing(undefined, undefined));

  await waitFor(() => {
    expect(result.current.query.ownedBy).toBeUndefined();
    expect(result.current.query.sharedWith).toBeUndefined();
  });
  expect(result.current.query.category).toBe("mine");
});

test("normalizes a published legacy view while preserving unrelated filters", async () => {
  const { result } = renderHook(() => useWorkflowListQuery(), {
    wrapper: wrapperWithEntry(
      "/?shared-by=alice@example.org&page=3&status=running&search=analysis",
    ),
  });

  await waitFor(() => {
    expect(result.current.query.ownedBy).toBe("alice@example.org");
  });
  expect(result.current.query).toMatchObject({
    sharedWith: undefined,
    page: 3,
    search: "analysis",
    status: "running",
  });
});

test("removes only published legacy sharing parameters", async () => {
  const { result } = renderWithLocation(
    "/?shared=true&page=3&status=running&search=analysis",
  );

  await waitFor(() => {
    expect(result.current.location.search).toContain("owned-by=anybody");
  });
  expect(result.current.location.search).not.toContain("shared=true");
  expect(result.current.location.search).toContain("page=3");
  expect(result.current.location.search).toContain("status=running");
  expect(result.current.location.search).toContain("search=analysis");
});

test("removes invalid page parameters and normalizes the query page to 1", async () => {
  const { result } = renderWithLocation("/workflows?page=abc");

  await waitFor(() => {
    expect(result.current.location.search).toBe("");
  });
  expect(result.current.workflowList.query.page).toBe(1);
});

test("removes status=deleted and resets the current page", async () => {
  const { result } = renderWithLocation("/workflows?status=deleted&page=2");

  await waitFor(() => {
    expect(result.current.location.search).toBe("");
  });
  expect(result.current.workflowList.query).toEqual(
    expect.objectContaining({
      page: 1,
      status: undefined,
      hasStatusFilter: false,
    }),
  );
});

test("drops the inactive parameter when both sharing parameters are present", async () => {
  const { result } = renderWithLocation(
    "/workflows?owned-by=alice@example.org&shared-with=nobody",
  );

  await waitFor(() => {
    expect(result.current.location.search).toBe("?shared-with=nobody");
  });
  expect(result.current.workflowList.query).toEqual(
    expect.objectContaining({
      category: "mine",
      ownedBy: undefined,
      sharedWith: "nobody",
    }),
  );
});

test("switches from shared-with mode to owned by you and resets pagination", async () => {
  const { result } = renderWithLocation(
    "/workflows?shared-with=anybody&page=3",
  );

  act(() => result.current.workflowList.setSharing(undefined, undefined));

  await waitFor(() => {
    expect(result.current.location.search).toBe("");
  });
  expect(result.current.workflowList.query).toEqual(
    expect.objectContaining({
      page: 1,
      ownedBy: undefined,
      sharedWith: undefined,
    }),
  );
});

test("writes owned-by=anybody explicitly because the empty URL defaults to your workflows", async () => {
  const { result } = renderWithLocation("/workflows?page=3");

  act(() => result.current.workflowList.setSharing("anybody", undefined));

  await waitFor(() => {
    expect(result.current.location.search).toBe("?owned-by=anybody");
  });
  expect(result.current.workflowList.query).toEqual(
    expect.objectContaining({
      page: 1,
      ownedBy: "anybody",
      sharedWith: undefined,
    }),
  );
});

test("reports active filters from committed workflow query state", async () => {
  const { result } = renderHook(() => useWorkflowListQuery(), {
    wrapper: wrapperWithEntry("/?search=analysis&sort=cpu-desc&page-size=20"),
  });

  expect(result.current.hasActiveFilters).toBe(true);

  act(() => result.current.clearFilters());

  await waitFor(() => {
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

test("clear filters restores the default view and preserves preferences", async () => {
  const { result } = renderWithLocation(
    "/?search=analysis&status=running&show-deleted=true&open-sessions=true&owned-by=alice@example.org&page=3&page-size=20&sort=cpu-desc&custom=value",
  );

  act(() => {
    result.current.workflowList.setSearchText("unsubmitted draft");
    result.current.workflowList.clearFilters();
  });

  await waitFor(() => {
    expect(result.current.workflowList.hasActiveFilters).toBe(false);
  });
  expect(result.current.workflowList.searchText).toBe("");
  expect(result.current.workflowList.query).toMatchObject({
    page: 1,
    pageSize: 20,
    search: "",
    sort: "cpu-desc",
    hasStatusFilter: false,
    includeDeleted: false,
    showOpenSessionsOnly: false,
    category: "shared-with-me",
    ownedBy: "anybody",
    sharedWith: undefined,
  });
  expect(result.current.location.search).toContain("page-size=20");
  expect(result.current.location.search).toContain("sort=cpu-desc");
  expect(result.current.location.search).toContain("custom=value");
  expect(result.current.location.search).toContain("owned-by=anybody");
  expect(result.current.location.search).not.toContain("page=3");
  expect(result.current.location.search).not.toContain("search=");
  expect(result.current.location.search).not.toContain("status=");
});

test("clear filters keeps the view derived from the parsed query, not the raw URL", async () => {
  const { result } = renderWithLocation(
    "/?owned-by=alice@example.org&shared-with=nobody",
  );

  // `shared-with` wins the parse, so this URL shows "Your workflows" and
  // clearing must not switch the view over the shadowed `owned-by`.
  await waitFor(() => {
    expect(result.current.workflowList.query.category).toBe("mine");
  });

  act(() => result.current.workflowList.clearFilters());

  await waitFor(() => {
    expect(result.current.location.search).toBe("");
  });
  expect(result.current.workflowList.query).toEqual(
    expect.objectContaining({
      category: "mine",
      ownedBy: undefined,
      sharedWith: undefined,
    }),
  );
});

test("clear filters removes published legacy sharing parameters", async () => {
  const { result } = renderWithLocation(
    "/?shared-by=alice@example.org&shared=true",
  );

  act(() => result.current.workflowList.clearFilters());

  await waitFor(() => {
    expect(result.current.location.search).toBe("?owned-by=anybody");
  });
});
