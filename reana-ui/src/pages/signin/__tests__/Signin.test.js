/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Signin from "../Signin";

const mockState = {
  config: {
    auth: { bff_enabled: true, login_url: "/api/login" },
  },
};

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) => selector(mockState),
}));

function renderSignin(initialEntry = "/signin") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Signin />
    </MemoryRouter>,
  );
}

test("renders one BFF identity-provider sign-in action", () => {
  renderSignin();

  expect(
    screen.getByRole("button", { name: "Sign in with identity provider" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Sign in with CERN Single Sign-On")).toBeNull();
  expect(screen.queryByText("Sign in with EOSC EU Node AAI")).toBeNull();
  expect(screen.queryByText(/Single Sign-On/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
});

test.each([
  [
    { pathname: "/signin", search: "?login_error=authorization" },
    "cancelled or not authorised",
  ],
  [
    {
      pathname: "/signin",
      state: {
        from: {
          pathname: "/",
          search: "?login_error=provisioning",
          hash: "",
        },
      },
    },
    "could not create or link your account",
  ],
])("surfaces a structured callback error", (initialEntry, message) => {
  renderSignin(initialEntry);

  expect(screen.getByText(new RegExp(message, "i"))).toBeInTheDocument();
});
