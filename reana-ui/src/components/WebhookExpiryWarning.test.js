/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { act, render, screen, waitFor } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import {
  GITLAB_WEBHOOK_TOKEN_FETCH,
  GITLAB_WEBHOOK_TOKEN_RECEIVED,
  GITLAB_WEBHOOK_TOKEN_RETRY_DELAY_MS,
} from "~/actions";
import client from "~/client";
import WebhookExpiryWarning, {
  nextWebhookAuthorizationTransition,
  webhookAuthorizationIsExpired,
  webhookAuthorizationNeedsAttention,
} from "./WebhookExpiryWarning";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("~/client", () => ({ getGitlabWebhookToken: jest.fn() }));

const status = (overrides = {}) => ({
  configured: true,
  expired: false,
  expires_at: "2026-08-24T12:00:00Z",
  max_lifetime_seconds: 400,
  ...overrides,
});

// Fake Redux state, read by useSelector's mock implementation below so each
// selector call (isSignedIn, getGitlabWebhookToken) returns independently,
// instead of one blanket value for every useSelector call.
let fakeState;
let dispatch;

beforeEach(() => {
  jest.clearAllMocks();
  fakeState = {
    signedIn: true,
    gitlabWebhookToken: {
      phase: "idle",
      status: null,
      retryAt: null,
      activeRequestId: null,
    },
  };
  // Execute thunks the same way redux-thunk does while retaining every
  // dispatched plain action for assertions.
  dispatch = jest.fn((action) =>
    typeof action === "function" ? action(dispatch) : action,
  );
  useDispatch.mockReturnValue(dispatch);
  useSelector.mockImplementation((selector) => {
    if (selector.name === "isSignedIn") return fakeState.signedIn;
    if (selector.name === "getGitlabWebhookToken")
      return fakeState.gitlabWebhookToken.status;
    if (selector.name === "getGitlabWebhookTokenRequest")
      return fakeState.gitlabWebhookToken;
    throw new Error(`Unexpected selector in test: ${selector.name}`);
  });
});

test("warns globally for an expired authorization", async () => {
  fakeState.gitlabWebhookToken = {
    phase: "ready",
    status: status({ expired: true }),
    retryAt: null,
    activeRequestId: null,
  };

  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );

  expect(
    await screen.findByText(/authorization has expired/i),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /your profile/i })).toHaveAttribute(
    "href",
    "/profile",
  );
});

test("dispatches the fetched status so other consumers stay in sync", async () => {
  client.getGitlabWebhookToken.mockResolvedValue({
    data: status({ expired: true }),
  });

  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(dispatch).toHaveBeenCalledWith({
      type: GITLAB_WEBHOOK_TOKEN_RECEIVED,
      status: status({ expired: true }),
      requestId: expect.any(Number),
    }),
  );
  expect(dispatch).toHaveBeenCalledWith({
    type: GITLAB_WEBHOOK_TOKEN_FETCH,
    requestId: expect.any(Number),
  });
});

test("uses the final quarter of the configured lifetime as the warning window", () => {
  const now = Date.parse("2026-08-24T11:58:30Z");
  expect(webhookAuthorizationNeedsAttention(status(), now)).toBe(true);
  expect(webhookAuthorizationNeedsAttention(status(), now - 11_000)).toBe(
    false,
  );
});

test("stays hidden when signed out", () => {
  fakeState.signedIn = false;
  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );
  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
});

test("reflects a renewal made elsewhere without its own fetch", () => {
  fakeState.gitlabWebhookToken = {
    phase: "ready",
    status: status({ expired: true }),
    retryAt: null,
    activeRequestId: null,
  };
  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );
  expect(screen.getByText(/authorization has expired/i)).toBeInTheDocument();
  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
});

test("does not refetch on remount while the first request is in flight", async () => {
  // WebhookExpiryWarning is mounted inside BasePage, which every page wraps
  // its own instance of rather than a persistent layout -- it unmounts and
  // remounts on every route change. Without the shared `phase` guard,
  // each of those remounts would refire the fetch.
  let resolveRequest;
  client.getGitlabWebhookToken.mockReturnValue(
    new Promise((resolve) => {
      resolveRequest = resolve;
    }),
  );

  const { unmount } = render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(client.getGitlabWebhookToken).toHaveBeenCalledTimes(1),
  );
  unmount();

  // The fetch-start action is synchronous, so a navigation remount observes
  // the shared loading phase even though the request has not resolved yet.
  fakeState.gitlabWebhookToken = {
    phase: "loading",
    status: null,
    retryAt: null,
    activeRequestId: 1,
  };
  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );

  expect(client.getGitlabWebhookToken).toHaveBeenCalledTimes(1);
  await act(async () => resolveRequest({ data: status() }));
});

test("retries a failed request only when its shared deadline is reached", () => {
  jest.useFakeTimers();
  const now = Date.parse("2026-08-25T12:00:00Z");
  jest.setSystemTime(now);
  fakeState.gitlabWebhookToken = {
    phase: "retry_wait",
    status: null,
    retryAt: now + GITLAB_WEBHOOK_TOKEN_RETRY_DELAY_MS,
    activeRequestId: null,
  };
  client.getGitlabWebhookToken.mockResolvedValue({ data: status() });

  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );

  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(GITLAB_WEBHOOK_TOKEN_RETRY_DELAY_MS - 1));
  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(client.getGitlabWebhookToken).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

test("does not retry a terminal request failure", () => {
  jest.useFakeTimers();
  fakeState.gitlabWebhookToken = {
    phase: "error",
    status: null,
    retryAt: null,
    activeRequestId: null,
  };

  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );
  act(() => jest.runOnlyPendingTimers());

  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
  jest.useRealTimers();
});

test("derives expiry from the deadline even when the cached flag is stale", () => {
  const expiry = Date.parse(status().expires_at);
  expect(webhookAuthorizationIsExpired(status(), expiry - 1)).toBe(false);
  expect(webhookAuthorizationIsExpired(status(), expiry)).toBe(true);
});

test("computes the next warning and expiry transitions", () => {
  const expiry = Date.parse(status().expires_at);
  const warning = expiry - (status().max_lifetime_seconds * 1000) / 4;
  expect(nextWebhookAuthorizationTransition(status(), warning - 1)).toBe(
    warning,
  );
  expect(nextWebhookAuthorizationTransition(status(), warning)).toBe(expiry);
});

test("updates the warning and expiry text without refetching", () => {
  jest.useFakeTimers();
  const expiry = Date.parse(status().expires_at);
  const warning = expiry - (status().max_lifetime_seconds * 1000) / 4;
  jest.setSystemTime(warning - 1);
  fakeState.gitlabWebhookToken = {
    phase: "ready",
    status: status(),
    retryAt: null,
    activeRequestId: null,
  };

  render(
    <MemoryRouter>
      <WebhookExpiryWarning />
    </MemoryRouter>,
  );
  expect(
    screen.queryByText(/authorization expires soon/i),
  ).not.toBeInTheDocument();

  act(() => jest.advanceTimersByTime(1));
  expect(screen.getByText(/authorization expires soon/i)).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(expiry - warning));
  expect(screen.getByText(/authorization has expired/i)).toBeInTheDocument();
  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
  jest.useRealTimers();
});
