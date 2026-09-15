/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios from "axios";

import client, {
  INTERACTIVE_SESSION_URL,
  USER_INFO_URL,
  isSessionExpiredError,
} from "~/client";

jest.mock("axios");

beforeEach(() => {
  axios.mockClear();
  client.setOnUnauthorized(null);
  document.cookie = "reana_csrf=; Max-Age=0";
});

test.each([
  "User not signed in",
  "User not logged in",
  "Session expired",
  // Exact reana-server wording for the no-session-cookie path (the most
  // routine expiry case: the access cookie is still present but expired,
  // and the session cookie needed to refresh it is already gone).
  "Session expired, please log in again.",
])("recognizes session-expiry 401 response: %s", (message) => {
  expect(
    isSessionExpiredError({ response: { status: 401, data: { message } } }),
  ).toBe(true);
});

test("recognizes the machine-readable terminal-session response", () => {
  expect(
    isSessionExpiredError({
      response: {
        status: 401,
        data: { code: "session_terminated", message: "Authentication failed" },
      },
    }),
  ).toBe(true);
});

test("does not treat an unrelated 401 as session expiry", () => {
  expect(
    isSessionExpiredError({
      response: { status: 401, data: { message: "GitLab token invalid" } },
    }),
  ).toBe(false);
});

test("treats any 401 from /api/you as session expiry, regardless of body", () => {
  // A 401 from an intermediary (a proxy, an ingress) may not carry the
  // message/code REANA server itself would use -- /api/you has no other
  // meaning than "who is signed in", so any 401 from it means the session
  // is gone.
  expect(
    isSessionExpiredError(
      { response: { status: 401, data: {} } },
      USER_INFO_URL,
    ),
  ).toBe(true);
});

test("still ignores an unrelated 401 from a non-session endpoint", () => {
  expect(
    isSessionExpiredError(
      {
        response: { status: 401, data: { message: "GitLab token invalid" } },
      },
      "/api/gitlab/projects",
    ),
  ).toBe(false);
});

test("clears browser auth when the server reports an expired session", async () => {
  const onUnauthorized = jest.fn();
  client.setOnUnauthorized(onUnauthorized);
  axios.mockRejectedValueOnce({
    response: { status: 401, data: { message: "Session expired" } },
  });

  await expect(client.getUser()).rejects.toBeDefined();

  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  client.setOnUnauthorized(null);
});

test("appends an encoded per-session notebook token", () => {
  expect(INTERACTIVE_SESSION_URL("/session?view=tree", "secret value")).toBe(
    "http://localhost/session?view=tree&token=secret%20value",
  );
});

test("adds the CSRF cookie value to non-safe requests", async () => {
  document.cookie = "reana_csrf=csrf-token";
  axios.mockResolvedValueOnce({ data: {} });

  await client.signOut();

  expect(axios).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "post",
      headers: { "X-REANA-CSRF": "csrf-token" },
    }),
  );
});

test("decodes a percent-encoded CSRF cookie value", async () => {
  document.cookie = `reana_csrf=${encodeURIComponent("token+with/special=chars")}`;
  axios.mockResolvedValueOnce({ data: {} });

  await client.signOut();

  expect(axios).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "post",
      headers: { "X-REANA-CSRF": "token+with/special=chars" },
    }),
  );
});

test("does not add a CSRF header to GET requests", async () => {
  document.cookie = "reana_csrf=csrf-token";
  axios.mockResolvedValueOnce({ data: {} });

  await client.getUser();

  expect(axios).toHaveBeenCalledWith(
    expect.objectContaining({ method: "get", headers: {} }),
  );
});
