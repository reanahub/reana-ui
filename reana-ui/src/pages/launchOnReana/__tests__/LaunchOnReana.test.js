/*
  This file is part of REANA.
  Copyright (C) 2022, 2023, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import client from "~/client";
import LaunchOnReana, { DEFAULT_WORKFLOW_NAME } from "../LaunchOnReana";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
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

beforeEach(() => {
  mockDispatch.mockClear();
  client.launchWorkflow = jest.fn().mockResolvedValue({
    data: {
      workflow_id: 111,
      message: "The workflow has been successfully submitted.",
    },
  });
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

  expect(screen.getByText("Parameters"));
  expect(screen.getByRole("heading")).toHaveTextContent("Launch on REANA");
  expect(screen.getByText(/events/));
  expect(screen.getByText(/1000/));
  expect(screen.getByText(/script/));
  expect(screen.getByText(/"run.C"/));

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

test("dispatches readable structured validation warnings", async () => {
  client.launchWorkflow.mockResolvedValueOnce({
    data: {
      workflow_id: 111,
      message:
        "The workflow has been successfully submitted, but some warnings were issued.",
      validation_warnings: [
        {
          code: "additional_properties",
          message: "Unexpected property 'resources'",
          path: "workflow",
        },
        {
          code: "parameters",
          message: "Input parameter 'events' is not used.",
          path: "",
        },
        { unexpected: "warning" },
      ],
    },
  });
  render(component({ url: "https://example.org/reana.yaml" }));

  fireEvent.click(screen.getByText("Launch"));

  await waitFor(() =>
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "Warning",
      header: "Workflow submitted with warnings",
      message:
        "The workflow has been successfully submitted, but some warnings were issued. " +
        "Unexpected property 'resources' (at workflow). " +
        "Input parameter 'events' is not used. " +
        '{"unexpected":"warning"}.',
    }),
  );
  const warningAction = mockDispatch.mock.calls
    .map(([action]) => action)
    .find(({ header }) => header === "Workflow submitted with warnings");
  expect(warningAction.message).not.toContain("[object Object]");
});
