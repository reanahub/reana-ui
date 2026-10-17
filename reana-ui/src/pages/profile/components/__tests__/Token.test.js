/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";

import Token from "../Token";

const mockState = {
  config: {
    docsURL: "https://docs.reana.io",
  },
};

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

afterEach(() => {
  mockState.config.docsURL = "https://docs.reana.io";
});

test("shows the reana-client login command for this server", () => {
  render(<Token />);

  expect(
    screen.getByText("reana-client login --server http://localhost"),
  ).toBeInTheDocument();
  expect(screen.queryByText(/REANA_SERVER_URL/)).toBeNull();
});

test("links to the client installation docs", () => {
  render(<Token />);

  expect(
    screen.getByRole("link", { name: "reana-client installed" }),
  ).toHaveAttribute(
    "href",
    "https://docs.reana.io/getting-started/installation/",
  );
});

test("does not link to the docs when no docs URL is configured", () => {
  mockState.config.docsURL = null;
  render(<Token />);

  expect(
    screen.queryByRole("link", { name: "reana-client installed" }),
  ).toBeNull();
  expect(screen.queryByText(/null/)).toBeNull();
});
