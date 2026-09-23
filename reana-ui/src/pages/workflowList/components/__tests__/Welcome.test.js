/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";

import Welcome from "../Welcome";

const mockState = {
  config: {
    auth: { bff_enabled: true },
    chatURL: null,
    docsURL: "https://docs.reana.io",
  },
};

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

test.each([
  [true, true],
  [false, false],
])("shows CLI login only when BFF auth is enabled", (bffEnabled, expected) => {
  mockState.config.auth.bff_enabled = bffEnabled;

  render(<Welcome />);

  const loginCommand = screen.queryByText(
    "reana-client login --server http://localhost",
  );
  expect(Boolean(loginCommand)).toBe(expected);
});

test.each([true, false])(
  "does not suggest the retired REANA_SERVER_URL variable (BFF: %s)",
  (bffEnabled) => {
    mockState.config.auth.bff_enabled = bffEnabled;

    render(<Welcome />);

    expect(screen.queryByText(/REANA_SERVER_URL/)).toBeNull();
  },
);

test("connects to the server without logging in when BFF auth is disabled", () => {
  mockState.config.auth.bff_enabled = false;

  render(<Welcome />);

  expect(
    screen.getByText("reana-client server-add http://localhost"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("reana-client server-use http://localhost"),
  ).toBeInTheDocument();
});
