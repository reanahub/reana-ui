/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import WorkflowSorting from "./WorkflowSorting";

test("shows the selected order and changes sorting", () => {
  const sort = jest.fn();

  render(<WorkflowSorting value="desc" sort={sort} />);

  expect(screen.getByText("Sort by")).toBeVisible();
  fireEvent.click(screen.getByRole("listbox", { name: "Sort workflows" }));
  fireEvent.click(screen.getByRole("option", { name: "Highest CPU usage" }));

  expect(sort).toHaveBeenCalledWith("cpu-desc");
});
