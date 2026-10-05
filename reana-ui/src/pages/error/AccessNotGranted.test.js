/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import AccessNotGranted from "./AccessNotGranted";

const mockDispatch = jest.fn();
let mockNotification = null;
let mockFetchError = undefined;

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) =>
    selector({
      notification: mockNotification,
      auth: { error: { authorizationError: mockFetchError } },
    }),
}));

beforeEach(() => {
  mockDispatch.mockClear();
  mockNotification = null;
  mockFetchError = undefined;
});

test("explains that authentication succeeded but entitlement did not", () => {
  render(<AccessNotGranted />);

  expect(
    screen.getByRole("heading", { name: "Access not granted" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/authenticated, but your identity/i),
  ).toBeInTheDocument();
});

test("shows the server's reason in the page body", () => {
  mockFetchError = {
    status: 403,
    code: "access_not_granted",
    message: "User does not have the required 'reana:user' role.",
  };
  render(<AccessNotGranted />);

  expect(
    screen.getByText("User does not have the required 'reana:user' role."),
  ).toBeInTheDocument();
});

test("keeps logout failures visible and allows another sign-out attempt", () => {
  mockNotification = {
    header: "An error has occurred",
    message: "Authentication service unavailable",
    isError: true,
  };
  render(<AccessNotGranted />);

  expect(screen.getByText("Authentication service unavailable")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
});
