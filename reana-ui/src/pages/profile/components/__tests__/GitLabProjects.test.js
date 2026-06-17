/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";

import {
  GITLAB_WEBHOOK_TOKEN_FETCH,
  GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
  GITLAB_WEBHOOK_TOKEN_UPDATED,
} from "~/actions";
import GitLabProjects from "../GitLabProjects";
import client from "~/client";
import reducer from "~/reducers";

jest.mock("~/client", () => ({
  __esModule: true,
  default: {
    getGitlabProjects: jest.fn(),
    getGitlabWebhookToken: jest.fn(),
    renewGitlabWebhookToken: jest.fn(),
    toggleGitlabProject: jest.fn(),
  },
  GITLAB_AUTH_URL: "https://reana.example.org/api/gitlab/connect",
}));

let store;

const AUTHORIZED_UNTIL = "2026-09-10T12:00:00Z";

function webhookStatus(overrides = {}) {
  return {
    configured: true,
    expired: false,
    expires_at: AUTHORIZED_UNTIL,
    max_lifetime_seconds: 2592000,
    ...overrides,
  };
}

function mockProjects() {
  client.getGitlabProjects.mockResolvedValue({
    data: {
      items: [
        { id: 1, name: "analysis", path: "user/analysis", hook_id: null },
      ],
      total: 1,
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // Keep the valid authorization fixtures in the future as time passes.
  jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-08-26T12:00:00Z"));
  store = createStore(reducer, applyMiddleware(thunk));
  mockProjects();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function renderProjects() {
  return render(
    <Provider store={store}>
      <GitLabProjects />
    </Provider>,
  );
}

function setWebhookStatus(status) {
  store.dispatch({ type: GITLAB_WEBHOOK_TOKEN_UPDATED, status });
}

test("shows the authorization expiry once the projects have loaded", async () => {
  setWebhookStatus(webhookStatus());

  renderProjects();

  expect(
    await screen.findByText(/GitLab webhook authorization is time-limited/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(new RegExp(new Date(AUTHORIZED_UNTIL).toLocaleString())),
  ).toBeInTheDocument();
  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
});

test("warns that GitLab cannot start workflows when authorization expired", async () => {
  setWebhookStatus(webhookStatus({ expired: true }));

  renderProjects();

  expect(
    await screen.findByText(/GitLab webhook authorization has expired/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/cannot start workflows until you renew/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/send a test delivery or re-enable it/i),
  ).toBeInTheDocument();
});

test("renewing refreshes the banner with the new expiry", async () => {
  const renewedUntil = "2026-10-10T12:00:00Z";
  setWebhookStatus(webhookStatus({ expired: true }));
  client.renewGitlabWebhookToken.mockResolvedValue({
    data: webhookStatus({ expires_at: renewedUntil }),
  });

  renderProjects();
  fireEvent.click(
    await screen.findByRole("button", { name: /renew webhook authorization/i }),
  );

  await waitFor(() =>
    expect(client.renewGitlabWebhookToken).toHaveBeenCalledTimes(1),
  );
  expect(
    await screen.findByText(/GitLab webhook authorization is time-limited/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(new RegExp(new Date(renewedUntil).toLocaleString())),
  ).toBeInTheDocument();
  // The global WebhookExpiryWarning banner shares this state, so a renewal
  // here must be dispatched, not just kept in this component's own state.
  expect(store.getState().gitlabWebhookToken.status).toEqual(
    webhookStatus({ expires_at: renewedUntil }),
  );
});

test("a failed renewal explains itself and stays retryable", async () => {
  setWebhookStatus(webhookStatus({ expired: true }));
  client.renewGitlabWebhookToken.mockRejectedValue(new Error("network down"));

  renderProjects();
  const renew = await screen.findByRole("button", {
    name: /renew webhook authorization/i,
  });
  fireEvent.click(renew);

  expect(
    await screen.findByText(
      /GitLab webhook authorization could not be renewed/i,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /renew webhook authorization/i }),
  ).toBeEnabled();
  expect(
    screen.getByText(/GitLab webhook authorization has expired/i),
  ).toBeInTheDocument();
});

test("a failed status request is visible and retryable", async () => {
  store.dispatch({ type: GITLAB_WEBHOOK_TOKEN_FETCH, requestId: 7 });
  store.dispatch({
    type: GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
    requestId: 7,
    retryAt: null,
  });
  client.getGitlabWebhookToken.mockResolvedValueOnce({ data: webhookStatus() });

  renderProjects();

  expect(
    await screen.findByText(
      /GitLab webhook authorization status is unavailable/i,
    ),
  ).toBeInTheDocument();
  const retryButton = screen.getByRole("button", {
    name: /retry loading authorization status/i,
  });
  fireEvent.click(retryButton);

  // The banner (and its now-loading button) must stay mounted while the
  // retry is in flight, not disappear because "loading" fell outside the
  // block's render condition and reappear only once the retry settles.
  expect(
    screen.getByText(/GitLab webhook authorization status is unavailable/i),
  ).toBeInTheDocument();
  expect(retryButton).toBeDisabled();

  expect(
    await screen.findByText(/GitLab webhook authorization is time-limited/i),
  ).toBeInTheDocument();
  expect(client.getGitlabWebhookToken).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByText(/authorization status is unavailable/i),
  ).not.toBeInTheDocument();
});

test("an expired authorization disables enabling a project", async () => {
  setWebhookStatus(webhookStatus({ expired: true }));

  renderProjects();

  // The project toggle renders once the list has loaded.
  expect(await screen.findByText("analysis")).toBeInTheDocument();
  const toggle = screen.getByRole("radio");
  // Enabling is blocked while expired (it would install a rejected webhook)...
  expect(toggle).toBeDisabled();
  fireEvent.click(toggle);
  expect(client.toggleGitlabProject).not.toHaveBeenCalled();
});

test("cached authorization becomes expired at its deadline without a refetch", async () => {
  jest.useFakeTimers();
  const now = Date.parse("2026-08-26T12:00:00Z");
  jest.setSystemTime(now);
  setWebhookStatus(
    webhookStatus({
      expires_at: new Date(now + 1000).toISOString(),
      max_lifetime_seconds: 2,
    }),
  );

  renderProjects();
  const toggle = await screen.findByRole("radio");
  expect(toggle).toBeEnabled();

  act(() => jest.advanceTimersByTime(500));
  act(() => jest.advanceTimersByTime(500));

  expect(toggle).toBeDisabled();
  expect(
    screen.getByText(/GitLab webhook authorization has expired/i),
  ).toBeInTheDocument();
  expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
});

test("fetches the webhook status itself when nothing has fetched it yet", async () => {
  // No setWebhookStatus() and no prior GITLAB_WEBHOOK_TOKEN_FETCH dispatch:
  // phase is still "idle", as it would be if WebhookExpiryWarning hasn't
  // mounted anywhere on this page. This component must not depend on that.
  client.getGitlabWebhookToken.mockResolvedValueOnce({
    data: webhookStatus(),
  });

  renderProjects();

  await waitFor(() =>
    expect(client.getGitlabWebhookToken).toHaveBeenCalledTimes(1),
  );
  expect(
    await screen.findByText(/GitLab webhook authorization is time-limited/i),
  ).toBeInTheDocument();
});

test("a 409 on enabling refreshes the status and shows the renewal action", async () => {
  // The authorization looks valid on load, so the toggle is enabled...
  setWebhookStatus(webhookStatus());
  // ...but it has expired by the time the toggle request reaches the server.
  client.getGitlabWebhookToken.mockResolvedValueOnce({
    data: webhookStatus({ expired: true }),
  });
  client.toggleGitlabProject.mockRejectedValue({ response: { status: 409 } });

  renderProjects();

  const toggle = await screen.findByRole("radio");
  expect(toggle).toBeEnabled();
  fireEvent.click(toggle);

  // The rejected enable refreshes status and surfaces the renewal action
  // instead of silently reverting the toggle.
  expect(
    await screen.findByText(/GitLab webhook authorization has expired/i),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /renew webhook authorization/i }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(client.getGitlabWebhookToken).toHaveBeenCalledTimes(1),
  );
  // The refetch alone isn't enough: the click that failed needs its own
  // explanation, not just an unrelated banner appearing elsewhere.
  await waitFor(() =>
    expect(store.getState().notification).toMatchObject({
      isWarning: true,
      header: expect.stringMatching(/gitlab authorization expired/i),
    }),
  );
});

test.each([
  [
    "an API failure",
    { response: { status: 500, data: { message: "GitLab is unavailable" } } },
    "GitLab is unavailable",
    500,
  ],
  ["a network failure", new Error("network down"), "network down", undefined],
])(
  "%s while toggling is reported and leaves the project retryable",
  async (_, error, message, status) => {
    setWebhookStatus(webhookStatus());
    client.toggleGitlabProject.mockRejectedValue(error);

    renderProjects();

    const toggle = await screen.findByRole("radio");
    fireEvent.click(toggle);

    await waitFor(() => expect(toggle).toBeEnabled());
    expect(store.getState().notification).toMatchObject({
      isError: true,
      message,
      status,
    });
    expect(client.getGitlabWebhookToken).not.toHaveBeenCalled();
  },
);

test("no banner is shown before a webhook secret exists", async () => {
  setWebhookStatus(webhookStatus({ configured: false, expires_at: null }));

  renderProjects();

  expect(await screen.findByText("analysis")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /renew webhook authorization/i }),
  ).not.toBeInTheDocument();
});
