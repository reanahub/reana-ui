/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NotificationBell, { getNotificationContent } from "../NotificationBell";

const mockDispatch = jest.fn();
let mockState;

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

const payload = {
  workflow_id: "cdcf48b1-c2f3-4693-8230-b066e088c6ac",
  workflow_name: "my-analysis.1",
  sharer_email: "alice@example.org",
  message: "Please review this workflow.",
  valid_until: "2030-12-31",
};

const stateWith = (items, unreadCount) => ({
  quota: {},
  persistentNotifications: { items, unreadCount },
});

afterEach(() => mockDispatch.mockClear());

test("links a shared workflow and keeps the sharing message", () => {
  expect(getNotificationContent({ type: "workflow_shared", payload })).toEqual({
    header: "alice@example.org shared a workflow",
    body: "my-analysis.1",
    icon: "share alternate",
    link: "/workflows/cdcf48b1-c2f3-4693-8230-b066e088c6ac",
    message: "Please review this workflow.",
    validUntil: "2030-12-31",
  });
});

test.each([
  ["workflow_unshared", "alice@example.org stopped sharing a workflow"],
  ["workflow_deleted", "alice@example.org deleted a shared workflow"],
])("does not link a workflow that is gone (%s)", (type, header) => {
  const content = getNotificationContent({ type, payload });
  expect(content.header).toBe(header);
  expect(content.body).toBe("my-analysis.1");
  expect(content.link).toBeNull();
  expect(content.message).toBeNull();
});

test("falls back to a generic entry for unknown notification types", () => {
  expect(getNotificationContent({ type: "something_new" }).header).toBe(
    "Notification",
  );
});

test("shows the sharing message and marks all notifications as read", () => {
  mockState = stateWith(
    [{ id: "1", type: "workflow_shared", payload, read_at: null }],
    1,
  );
  const { container } = render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );

  fireEvent.click(container.querySelector("i.bell"));

  expect(
    screen.getByText("alice@example.org shared a workflow"),
  ).toBeInTheDocument();
  expect(screen.getByText(/Please review this workflow\./)).toBeInTheDocument();
  expect(screen.getByText("Access expires on 2030-12-31")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Mark all read"));
  expect(mockDispatch).toHaveBeenCalledTimes(1);
});

test("says so when there are no notifications", () => {
  mockState = stateWith([], 0);
  const { container } = render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );

  fireEvent.click(container.querySelector("i.bell"));

  expect(screen.getByText("You have no notifications")).toBeInTheDocument();
});
