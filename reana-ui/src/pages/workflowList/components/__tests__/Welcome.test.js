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
    chatURL: null,
    docsURL: "https://docs.reana.io",
  },
};

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

afterEach(() => {
  mockState.config.docsURL = "https://docs.reana.io";
});

test("shows the CLI login command", () => {
  render(<Welcome />);

  expect(
    screen.getByText("reana-client login --server http://localhost"),
  ).toBeInTheDocument();
});

test("does not suggest the retired REANA_SERVER_URL variable", () => {
  render(<Welcome />);

  expect(screen.queryByText(/REANA_SERVER_URL/)).toBeNull();
});

test("links to the client installation docs", () => {
  render(<Welcome />);

  expect(
    screen.getByRole("link", { name: "install reana-client" }),
  ).toHaveAttribute(
    "href",
    "https://docs.reana.io/getting-started/installation/",
  );
});

test("does not hard-code the pip installation steps", () => {
  render(<Welcome />);

  expect(screen.queryByText(/pip install/)).toBeNull();
  expect(screen.queryByText(/virtualenv/)).toBeNull();
});

test("does not link to the docs when no docs URL is configured", () => {
  mockState.config.docsURL = null;
  render(<Welcome />);

  expect(
    screen.queryByRole("link", { name: "install reana-client" }),
  ).toBeNull();
  expect(screen.queryByText(/null/)).toBeNull();
});
