/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Welcome from "../Welcome";

const mockState = {
  config: { docsURL: "https://docs.reana.io", launcherExamples: [] },
};

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

afterEach(() => {
  mockState.config.docsURL = "https://docs.reana.io";
});

const renderWelcome = () =>
  render(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>,
  );

test("links to the launcher docs", () => {
  renderWelcome();

  expect(screen.getByRole("link", { name: "launcher docs" })).toHaveAttribute(
    "href",
    "https://docs.reana.io/running-workflows/launching-workflows/",
  );
});

test("does not link to the docs when no docs URL is configured", () => {
  mockState.config.docsURL = null;
  renderWelcome();

  expect(screen.queryByRole("link", { name: "launcher docs" })).toBeNull();
});
