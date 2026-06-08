/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import client from "~/client";
import reanaApp from "~/reducers";
import {
  ERROR,
  GITLAB_WEBHOOK_TOKEN_FETCH,
  GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
  GITLAB_WEBHOOK_TOKEN_RECEIVED,
  GITLAB_WEBHOOK_TOKEN_RETRY_DELAY_MS,
  NOTIFICATION,
  PERSISTENT_NOTIFICATIONS_ERROR,
  USER_FETCH_ERROR,
  USER_SIGNOUT,
  userSignout,
  WORKFLOW_LIST_REFRESH,
  loadUser,
  loadGitlabWebhookTokenStatus,
  loadPersistentNotifications,
  markAllPersistentNotificationsRead,
  markPersistentNotificationRead,
  openInteractiveSession,
} from "~/actions";
import {
  NOTIFICATION_URL,
  NOTIFICATIONS_READ_ALL_URL,
  USER_INFO_URL,
  USER_SIGNOUT_URL,
} from "~/client";

afterEach(() => {
  jest.restoreAllMocks();
});

test("opens an interactive session using the configured inactivity warning", async () => {
  jest.spyOn(client, "openInteractiveSession").mockResolvedValue({ data: {} });
  const dispatch = jest.fn();
  const getStore = () => ({
    config: { maxInteractiveSessionInactivityPeriod: 7 },
  });

  await openInteractiveSession("workflow-id", { type: "jupyter" })(
    dispatch,
    getStore,
  );

  expect(client.openInteractiveSession).toHaveBeenCalledWith("workflow-id", {
    type: "jupyter",
  });
  expect(dispatch).toHaveBeenCalledWith({ type: WORKFLOW_LIST_REFRESH });
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: NOTIFICATION,
      message: expect.stringContaining("7 days of inactivity"),
    }),
  );
});

test("preserves the machine-readable access entitlement error", async () => {
  jest.spyOn(client, "getUser").mockRejectedValue({
    response: {
      status: 403,
      statusText: "Forbidden",
      data: {
        code: "access_not_granted",
        message: "The required REANA role is missing.",
      },
    },
  });
  const dispatch = jest.fn();

  await loadUser()(dispatch);

  expect(dispatch).toHaveBeenCalledWith({
    type: USER_FETCH_ERROR,
    loader: true,
    status: 403,
    statusText: "Forbidden",
    code: "access_not_granted",
    message: "The required REANA role is missing.",
  });
  expect(dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: ERROR }),
  );
});

test("handles a user-info network failure without throwing", async () => {
  jest
    .spyOn(client, "getUser")
    .mockRejectedValue(new Error("Network unavailable"));
  const dispatch = jest.fn();

  await expect(loadUser()(dispatch)).resolves.toBeUndefined();

  expect(dispatch).toHaveBeenCalledWith({
    type: ERROR,
    name: USER_INFO_URL,
    status: undefined,
    message: "Network unavailable",
    header: "An error has occurred",
  });
  expect(dispatch).toHaveBeenCalledWith({
    type: USER_FETCH_ERROR,
    loader: true,
    status: undefined,
    statusText: undefined,
    code: undefined,
    message: undefined,
  });
});

test("tags a background (loader: false) fetch failure so it can't block the app", async () => {
  jest.spyOn(client, "getUser").mockRejectedValue({
    response: {
      status: 503,
      statusText: "Service Unavailable",
      data: {},
    },
  });
  const dispatch = jest.fn();

  await loadUser({ loader: false })(dispatch);

  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: USER_FETCH_ERROR, loader: false }),
  );
});

test("shares a successful webhook-status request lifecycle", async () => {
  const status = { configured: true, expired: false };
  jest
    .spyOn(client, "getGitlabWebhookToken")
    .mockResolvedValue({ data: status });
  const dispatch = jest.fn();

  await loadGitlabWebhookTokenStatus()(dispatch);

  expect(dispatch).toHaveBeenNthCalledWith(1, {
    type: GITLAB_WEBHOOK_TOKEN_FETCH,
    requestId: expect.any(Number),
  });
  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: GITLAB_WEBHOOK_TOKEN_RECEIVED,
    status,
    requestId: expect.any(Number),
  });
});

test("records one stable retry deadline after a webhook-status failure", async () => {
  const now = Date.parse("2026-08-25T12:00:00Z");
  jest.spyOn(Date, "now").mockReturnValue(now);
  jest
    .spyOn(client, "getGitlabWebhookToken")
    .mockRejectedValue(new Error("unavailable"));
  const dispatch = jest.fn();

  await loadGitlabWebhookTokenStatus()(dispatch);

  expect(dispatch).toHaveBeenNthCalledWith(1, {
    type: GITLAB_WEBHOOK_TOKEN_FETCH,
    requestId: expect.any(Number),
  });
  expect(dispatch).toHaveBeenNthCalledWith(2, {
    type: GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
    retryAt: now + GITLAB_WEBHOOK_TOKEN_RETRY_DELAY_MS,
    requestId: expect.any(Number),
  });
});

test("does not schedule another retry after the automatic webhook retry", async () => {
  jest
    .spyOn(client, "getGitlabWebhookToken")
    .mockRejectedValue(new Error("still unavailable"));
  const dispatch = jest.fn();

  await loadGitlabWebhookTokenStatus({ automaticRetry: true })(dispatch);

  expect(dispatch).toHaveBeenLastCalledWith({
    type: GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
    retryAt: null,
    requestId: expect.any(Number),
  });
});

test("does not retry a permanent webhook-status failure", async () => {
  jest.spyOn(client, "getGitlabWebhookToken").mockRejectedValue({
    response: { status: 403 },
  });
  const dispatch = jest.fn();

  await loadGitlabWebhookTokenStatus()(dispatch);

  expect(dispatch).toHaveBeenLastCalledWith({
    type: GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
    retryAt: null,
    requestId: expect.any(Number),
  });
});

test.each([
  [
    "HTTP failure",
    { response: { status: 503, data: { message: "Try again later" } } },
    503,
    "Try again later",
  ],
  [
    "network failure",
    new Error("Network unavailable"),
    undefined,
    "Network unavailable",
  ],
])(
  "reports a sign-out %s without breaking retry",
  async (_name, error, status, message) => {
    jest.spyOn(client, "signOut").mockRejectedValue(error);
    const dispatch = jest.fn();

    await expect(userSignout()(dispatch)).resolves.toBeUndefined();

    expect(dispatch).toHaveBeenCalledWith({ type: USER_SIGNOUT });
    expect(dispatch).toHaveBeenCalledWith({
      type: ERROR,
      name: USER_SIGNOUT_URL,
      status,
      message,
      header: "An error has occurred",
    });
  },
);

test("a failed notification fetch is reported to the notification bell", async () => {
  jest.spyOn(client, "getNotifications").mockRejectedValue(new Error("down"));
  const dispatch = jest.fn();

  await loadPersistentNotifications()(dispatch);

  expect(dispatch).toHaveBeenCalledWith({
    type: PERSISTENT_NOTIFICATIONS_ERROR,
  });
});

test.each([
  [
    "one notification",
    "markNotificationRead",
    () => markPersistentNotificationRead("1"),
    NOTIFICATION_URL("1"),
  ],
  [
    "all notifications",
    "markAllNotificationsRead",
    () => markAllPersistentNotificationsRead(),
    NOTIFICATIONS_READ_ALL_URL,
  ],
])(
  "a failed read update of %s shows an error",
  async (_, method, action, url) => {
    jest.spyOn(client, method).mockRejectedValue({
      response: { status: 500, data: { message: "Database unavailable." } },
    });
    const dispatch = jest.fn();

    await expect(action()(dispatch)).resolves.toBeUndefined();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ERROR,
        name: url,
        message: "Database unavailable.",
      }),
    );
  },
);

describe("notification refreshes and read updates", () => {
  const notification = (id, read = false) => ({
    id,
    read_at: read ? "2026-10-14T12:00:00" : null,
  });
  const response = (notifications) => ({
    data: {
      notifications,
      unread_count: notifications.filter((n) => !n.read_at).length,
    },
  });
  const deferred = () => {
    let resolve;
    const promise = new Promise((r) => (resolve = r));
    return { promise, resolve };
  };
  const createStore = () => {
    let state = reanaApp(undefined, { type: "init" });
    const dispatch = (action) =>
      typeof action === "function"
        ? action(dispatch)
        : (state = reanaApp(state, action));
    return { dispatch, getState: () => state.persistentNotifications };
  };

  test.each([
    [
      "one notification",
      "markNotificationRead",
      () => markPersistentNotificationRead("1"),
    ],
    [
      "all notifications",
      "markAllNotificationsRead",
      () => markAllPersistentNotificationsRead(),
    ],
  ])("a late refresh cannot undo a read of %s", async (_, method, action) => {
    const store = createStore();
    const stale = deferred();
    jest
      .spyOn(client, "getNotifications")
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce(response([notification("1", true)]));
    jest.spyOn(client, method).mockResolvedValue({ data: {} });

    const refresh = store.dispatch(loadPersistentNotifications());
    await store.dispatch(action());
    stale.resolve(response([notification("1")]));
    await refresh;

    expect(store.getState().unreadCount).toBe(0);
    expect(store.getState().items).toEqual([notification("1", true)]);
  });

  test("a notification that arrives during a bulk read stays unread", async () => {
    const store = createStore();
    const readAll = deferred();
    jest
      .spyOn(client, "getNotifications")
      .mockResolvedValueOnce(
        response([notification("2"), notification("1", true)]),
      )
      .mockResolvedValueOnce(
        response([notification("2"), notification("1", true)]),
      );
    jest
      .spyOn(client, "markAllNotificationsRead")
      .mockReturnValue(readAll.promise);

    const bulkRead = store.dispatch(markAllPersistentNotificationsRead());
    await store.dispatch(loadPersistentNotifications());
    readAll.resolve({ data: {} });
    await bulkRead;

    expect(store.getState().unreadCount).toBe(1);
    expect(store.getState().items[0]).toEqual(notification("2"));
  });
});
