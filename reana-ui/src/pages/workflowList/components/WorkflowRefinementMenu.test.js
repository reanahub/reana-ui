/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import WorkflowRefinementMenu from "./WorkflowRefinementMenu";

test("shows the selected refinement and handles selection", () => {
  const onChange = jest.fn();

  render(
    <WorkflowRefinementMenu
      ariaLabel="Filter sharing"
      options={[
        { value: "all", label: "All", icon: "list" },
        { value: "shared", label: "Shared with others", icon: "share" },
      ]}
      value="all"
      onChange={onChange}
    />,
  );

  expect(screen.getByText("All").closest(".item")).toHaveClass("active");
  expect(
    screen.getByText("Shared with others").closest(".item"),
  ).not.toHaveClass("active");

  fireEvent.click(screen.getByText("Shared with others"));

  expect(onChange).toHaveBeenCalledWith("shared");
});
