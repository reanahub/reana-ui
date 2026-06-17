/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import client from "~/client";
import {
  ERROR,
  GITLAB_WEBHOOK_TOKEN_FETCH,
  GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
  GITLAB_WEBHOOK_TOKEN_RECEIVED,
  GITLAB_WEBHOOK_TOKEN_RETRY_DELAY_MS,
  NOTIFICATION,
  USER_FETCH_ERROR,
  USER_SIGNOUT,
  userSignout,
  WORKFLOW_LIST_REFRESH,
  loadUser,
  loadGitlabWebhookTokenStatus,
  openInteractiveSession,
} from "~/actions";
import { USER_INFO_URL, USER_SIGNOUT_URL } from "~/client";

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
