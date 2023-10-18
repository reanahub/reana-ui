/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import client from "~/client";
import LaunchOnReana, { DEFAULT_WORKFLOW_NAME } from "../LaunchOnReana";

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => jest.fn(),
}));
jest.mock("../../BasePage", () => ({ children }) => <>{children}</>);

const component = (searchParams) => (
  <MemoryRouter
    initialEntries={[
      {
        pathname: "/launch",
        search: `?${new URLSearchParams(searchParams).toString()}`,
      },
    ]}
  >
    <LaunchOnReana />
  </MemoryRouter>
);

beforeAll(() => {
  client.launchWorkflow = () => Promise.resolve({ data: { workflow_id: 111 } });
});

test("loads and displays launch on reana page", async () => {
  render(
    component({
      url: "https://example.org/reana.yaml",
      foo: "bar",
      name: "roofit",
      parameters: JSON.stringify({ events: 1000, script: "run.C" }),
    }),
  );
  await waitFor(() => screen.getByRole("heading"));

  expect(screen.getByRole("heading")).toHaveTextContent("Launch on REANA");
  expect(screen.getByRole("button")).not.toBeDisabled();
  expect(screen.getByText("https://example.org/reana.yaml"));

  expect(screen.getByText("roofit"));
  expect(screen.queryByText("Executing workflow...")).not.toHaveClass("active");

  expect(screen.getByText("Parameters:"));
  expect(screen.getByRole("heading")).toHaveTextContent("Launch on REANA");
  expect(screen.getByText(/events: 1000/));
  expect(screen.getByText(/script: run.C/));

  fireEvent.click(screen.getByText("Launch"));
  await waitFor(() =>
    expect(screen.getByText("Executing workflow...")).toHaveClass("active"),
  );
});

test("displays default workflow name when no name is provided", async () => {
  render(
    component({
      url: "https://zenodo.org/reana/specs/reana-cwl.yaml",
      foo: "bar",
    }),
  );
  await waitFor(() => screen.getByRole("heading"));
  expect(screen.getByText(DEFAULT_WORKFLOW_NAME));
});

test("invalid workflow parameters are not displayed", async () => {
  render(
    component({
      url: "https://example.org/reana.yaml",
      parameters: "{foo, bar}",
    }),
  );
  await waitFor(() => screen.getByRole("heading"));
  expect(screen.getByRole("heading")).toHaveTextContent("Launch on REANA");
  expect(screen.queryByText("Parameters")).toBeNull();
});
