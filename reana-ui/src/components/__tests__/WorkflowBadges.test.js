/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import client from "~/client";
import WorkflowBadges from "../WorkflowBadges";

const mockDispatch = jest.fn();
const mockState = { auth: { email: "owner@example.org" } };

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

afterEach(() => {
  jest.restoreAllMocks();
  mockDispatch.mockClear();
});

test("fetches the session secret before opening a notebook", async () => {
  jest.spyOn(client, "getInteractiveSessionSecret").mockResolvedValue({
    data: { session_secret: "notebook secret" },
  });
  const sessionWindow = {
    close: jest.fn(),
    location: { href: "" },
    opener: window,
  };
  jest.spyOn(window, "open").mockReturnValue(sessionWindow);
  const workflow = {
    id: "workflow-id",
    duration: null,
    launcherURL: null,
    ownerEmail: "owner@example.org",
    services: [],
    session_status: "running",
    session_uri: "/workflow-id",
    size: { raw: 0, human_readable: "0 Bytes" },
  };

  render(<WorkflowBadges workflow={workflow} />);
  const notebookButton = screen.getByRole("button", { name: /Notebook/ });
  expect(notebookButton).not.toHaveAttribute("href");
  fireEvent.click(notebookButton);

  await waitFor(() => {
    expect(sessionWindow.location.href).toBe(
      "http://localhost/workflow-id?token=notebook%20secret",
    );
  });
  expect(client.getInteractiveSessionSecret).toHaveBeenCalledWith(
    "workflow-id",
  );
  expect(sessionWindow.opener).toBeNull();
});
