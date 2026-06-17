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
  mockState = {
    config: { loading: false },
    auth: { email: "user@example.org", error: {}, loadingUser: false },
  };
});

test("a blocking fetch error offers a retry that re-dispatches loadUser", () => {
  mockState.auth.error = {
    authorizationError: {
      status: 503,
      statusText: "Service Unavailable",
      message: "The identity provider is temporarily unavailable.",
    },
  };

  render(<App />);

  expect(
    screen.getByRole("heading", { name: "Service Unavailable" }),
  ).toBeInTheDocument();
  const retryButton = screen.getByRole("button", { name: "Retry" });
  fireEvent.click(retryButton);
  expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
});
