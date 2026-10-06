/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import App from "./App";

const mockDispatch = jest.fn();
let mockState;

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

beforeEach(() => {
  mockDispatch.mockClear();
  document.cookie = "reana_csrf=; Max-Age=0";
  mockState = {
    notification: null,
    config: { loading: false },
    auth: { email: null, error: {}, loadingUser: false },
  };
});

const failUserFetch = () => {
  mockState.auth.error = {
    authorizationError: {
      status: 503,
      statusText: "Service Unavailable",
      message: "The identity provider is temporarily unavailable.",
    },
  };
};

test("a blocking fetch error offers a retry that re-dispatches loadUser", () => {
  failUserFetch();

  render(<App />);

  expect(
    screen.getByRole("heading", { name: "Service Unavailable" }),
  ).toBeInTheDocument();
  const retryButton = screen.getByRole("button", { name: "Retry" });
  fireEvent.click(retryButton);
  expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
});

test("a blocking fetch error lets a browser with a session sign out", () => {
  document.cookie = "reana_csrf=csrf-token";
  failUserFetch();

  render(<App />);

  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
});

test("a blocking fetch error offers no sign-out without a session", () => {
  failUserFetch();

  render(<App />);

  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Sign out" }),
  ).not.toBeInTheDocument();
});

test("a blocking fetch error keeps sign-out failures visible", () => {
  document.cookie = "reana_csrf=csrf-token";
  failUserFetch();
  mockState.notification = {
    header: "An error has occurred",
    message: "Browser session storage is temporarily unavailable.",
    isError: true,
  };

  render(<App />);

  expect(
    screen.getByText("Browser session storage is temporarily unavailable."),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
});

test("a blocking fetch error is not repeated as a notification", () => {
  failUserFetch();
  mockState.notification = {
    header: "An error has occurred",
    message: "The identity provider is temporarily unavailable.",
    isError: true,
  };

  render(<App />);

  expect(
    screen.getAllByText("The identity provider is temporarily unavailable."),
  ).toHaveLength(1);
});
