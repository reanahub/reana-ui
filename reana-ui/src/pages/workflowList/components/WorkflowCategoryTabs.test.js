/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import WorkflowCategoryTabs from "./WorkflowCategoryTabs";

test("renders workflow views and selects a different category", () => {
  const setCategory = jest.fn();
  const refresh = jest.fn();

  render(
    <WorkflowCategoryTabs
      category="shared-with-me"
      setCategory={setCategory}
      refreshedAt="14:22:02 UTC"
      refresh={refresh}
    />,
  );

  expect(
    screen.getByRole("navigation", { name: "Workflow views" }),
  ).toBeVisible();
  expect(screen.getByText("Your workflows")).not.toHaveClass("active");
  expect(screen.getByText("Shared with you")).toHaveClass("active");
  expect(screen.queryByText("All workflows")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Refreshed at 14:22:02 UTC" }),
  ).toBeVisible();

  fireEvent.click(screen.getByText("Your workflows"));
  fireEvent.click(
    screen.getByRole("button", { name: "Refreshed at 14:22:02 UTC" }),
  );

  expect(setCategory).toHaveBeenCalledWith("mine");
  expect(refresh).toHaveBeenCalled();
});
