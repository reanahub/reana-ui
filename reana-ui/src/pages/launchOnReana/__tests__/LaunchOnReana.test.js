/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import LaunchOnReana from "../LaunchOnReana";

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}));
jest.mock("../../BasePage", () => ({ children }) => <>{children}</>);

test("loads and displays launch on reana page", async () => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/launch",
          search: "?url=https://example.org/reana.yaml&foo=bar",
        },
      ]}
    >
      <LaunchOnReana />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByRole("heading"));

  expect(screen.getByRole("heading")).toHaveTextContent("Launch on REANA");
  expect(screen.getByRole("button")).not.toBeDisabled();
  expect(screen.getByText("url: https://example.org/reana.yaml"));
  const invalidQsParams = screen.queryByText("foo: bar");
  expect(invalidQsParams).toBeNull();

  const loadingSpinner = screen.queryByText("Executing workflow...");
  expect(loadingSpinner).toBeNull();
  fireEvent.click(screen.getByText("Launch"));
  expect(screen.getByText("Executing workflow..."));
});
