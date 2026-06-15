/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import { NON_DELETED_STATUSES } from "~/config";
import WorkflowStatusFilter from "./WorkflowStatusFilter";

test("selects common statuses and reveals additional statuses", () => {
  const filter = jest.fn();

  render(
    <WorkflowStatusFilter
      statusFilter="running"
      filter={filter}
      hasStatusFilter
    />,
  );

  expect(screen.getByText("running").closest(".item")).toHaveClass("active");
  expect(screen.queryByText("created")).not.toBeInTheDocument();

  fireEvent.click(screen.getByText("More statuses"));
  fireEvent.click(screen.getByText("created"));
  fireEvent.click(screen.getByText("Any"));

  expect(filter).toHaveBeenNthCalledWith(1, "created");
  expect(filter).toHaveBeenNthCalledWith(2, undefined);
});

test("offers every supported non-deleted status exactly once", () => {
  render(
    <WorkflowStatusFilter
      statusFilter={undefined}
      filter={jest.fn()}
      hasStatusFilter={false}
    />,
  );

  fireEvent.click(screen.getByText("More statuses"));

  NON_DELETED_STATUSES.forEach((status) => {
    expect(screen.getAllByText(status)).toHaveLength(1);
  });
  expect(screen.queryByText("deleted")).not.toBeInTheDocument();
});

test("lists an active additional status while the menu is collapsed", () => {
  render(
    <WorkflowStatusFilter
      statusFilter="pending"
      filter={jest.fn()}
      hasStatusFilter
    />,
  );

  expect(screen.getByText("pending").closest(".item")).toHaveClass("active");
  expect(screen.getByText("More statuses")).toBeVisible();
  expect(screen.queryByText("queued")).not.toBeInTheDocument();
});

test("keeps the active additional status listed after collapsing", () => {
  render(
    <WorkflowStatusFilter
      statusFilter="pending"
      filter={jest.fn()}
      hasStatusFilter
    />,
  );

  fireEvent.click(screen.getByText("More statuses"));
  expect(screen.getByText("queued")).toBeVisible();

  fireEvent.click(screen.getByText("Fewer statuses"));

  expect(screen.queryByText("queued")).not.toBeInTheDocument();
  expect(screen.getByText("pending").closest(".item")).toHaveClass("active");
});

test("lists an additional status selected after initial render", () => {
  const { rerender } = render(
    <WorkflowStatusFilter
      statusFilter="running"
      filter={jest.fn()}
      hasStatusFilter
    />,
  );

  expect(screen.queryByText("pending")).not.toBeInTheDocument();

  rerender(
    <WorkflowStatusFilter
      statusFilter="pending"
      filter={jest.fn()}
      hasStatusFilter
    />,
  );

  expect(screen.getByText("pending").closest(".item")).toHaveClass("active");
});
