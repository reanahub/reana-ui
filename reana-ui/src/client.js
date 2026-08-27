/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022, 2023, 2024, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios from "axios";

import { api } from "~/config";
import { stringifyQueryParams } from "~/util";

export function isSessionExpiredError(error) {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  const message = (error?.response?.data?.message || "").toLowerCase();
  return (
    status === 401 &&
    (code === "session_terminated" ||
      message.includes("user not signed in") ||
      message.includes("user not logged in") ||
      message.includes("session expired"))
  );
}

// URLs
export const CONFIG_URL = `${api}/api/config`;
export const USER_INFO_URL = `${api}/api/you`;
export const CLUSTER_INFO_URL = `${api}/api/info`;
export const USER_SIGNOUT_URL = `${api}/api/logout`;
export const USERS_SHARED_WITH_YOU_URL = `${api}/api/users/shared-with-you`;
export const USERS_YOU_SHARED_WITH_URL = `${api}/api/users/you-shared-with`;
export const CLUSTER_STATUS_URL = `${api}/api/status`;
export const GITLAB_AUTH_URL = `${api}/api/gitlab/connect`;
export const GITLAB_PROJECTS_URL = (params) =>
  `${api}/api/gitlab/projects?${stringifyQueryParams(params)}`;
export const GITLAB_WEBHOOK_URL = `${api}/api/gitlab/webhook`;
export const GITLAB_WEBHOOK_TOKEN_URL = `${api}/api/gitlab/webhook-token`;
export const WORKFLOWS_URL = (params) =>
  `${api}/api/workflows?verbose=true&${stringifyQueryParams(params)}`;
export const WORKFLOW_LOGS_URL = (id) => `${api}/api/workflows/${id}/logs`;
export const WORKFLOW_SPECIFICATION_URL = (id) =>
  `${api}/api/workflows/${id}/specification`;
export const WORKFLOW_PRUNE_URL = (id, params) =>
  `${api}/api/workflows/${id}/prune?${stringifyQueryParams(params)}`;
export const WORKFLOW_RETENTION_RULES_URL = (id) =>
  `${api}/api/workflows/${id}/retention_rules`;
export const WORKFLOW_FILES_URL = (id, params) =>
  `${api}/api/workflows/${id}/workspace?${stringifyQueryParams(params)}`;
export const WORKFLOW_FILE_URL = (id, filename, preview = true) =>
  `${api}/api/workflows/${id}/workspace/${filename}?${stringifyQueryParams(
    preview,
  )}`;
export const WORKFLOW_SET_STATUS_URL = (id, status) =>
  `${api}/api/workflows/${id}/status?${stringifyQueryParams(status)}`;
export const WORKFLOW_SHARE_STATUS_URL = (id) =>
  `${api}/api/workflows/${id}/share-status`;
export const WORKFLOW_SHARE_URL = (id) => `${api}/api/workflows/${id}/share`;
export const WORKFLOW_UNSHARE_URL = (id) =>
  `${api}/api/workflows/${id}/unshare`;
export const INTERACTIVE_SESSIONS_OPEN_URL = (id, type = "jupyter") =>
  `${api}/api/workflows/${id}/open/${type}`;
export const INTERACTIVE_SESSIONS_CLOSE_URL = (id) =>
  `${api}/api/workflows/${id}/close/`;
export const INTERACTIVE_SESSION_SECRET_URL = (id) =>
  `${api}/api/workflows/${id}/interactive-session-secret`;
export const INTERACTIVE_SESSION_URL = (sessionUri, sessionSecret) => {
  const sessionUrl = `${api}${sessionUri}`;
  if (!sessionSecret) return sessionUrl;
  const separator = sessionUrl.includes("?") ? "&" : "?";
  return `${sessionUrl}${separator}token=${encodeURIComponent(sessionSecret)}`;
};
export const DASK_DASHBOARD_URL = (workflow_id) =>
  `${api}/${workflow_id}/dashboard/status`;
export const LAUNCH_ON_REANA_URL = `${api}/api/launch`;

const CSRF_COOKIE = "reana_csrf";
const CSRF_HEADER = "X-REANA-CSRF";

function getCookieValue(name) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

class Client {
  /**
   * Class responsible of encapsulating all the network calls so the library used
   * is independent from Redux/React lifecycle. The methods of this class return
   * Promises to be handled by other modules.
   *
   * @param {String} url URL to request
   * @param {Object} data Request data
   * @param {String} method HTTP Method
   * @param {Boolean} withCredentials - Whether ot not cross-site Access-Control requests should be made using credentials.
   * @returns {Promise} Axios Promise
   */

  constructor() {
    this._onUnauthorized = null;
  }

  setOnUnauthorized(callback) {
    this._onUnauthorized = callback;
  }

  async _request(
    url,
    {
      data = null,
      method = "get",
      withCredentials = true,
      headers: optionHeaders = {},
      ...options
    } = {},
  ) {
    const requestMethod = method.toLowerCase();
    const csrfToken = !["get", "head", "options"].includes(requestMethod)
      ? getCookieValue(CSRF_COOKIE)
      : null;
    const headers = {
      ...optionHeaders,
      ...(csrfToken ? { [CSRF_HEADER]: csrfToken } : {}),
    };
    try {
      return await axios({
        method,
        url,
        data,
        withCredentials,
        headers,
        ...options,
      });
    } catch (error) {
      if (this._onUnauthorized && isSessionExpiredError(error)) {
        this._onUnauthorized();
      }
      throw error;
    }
  }

  getConfig() {
    return this._request(CONFIG_URL);
  }

  getUser() {
    return this._request(USER_INFO_URL);
  }

  getClusterInfo() {
    return this._request(CLUSTER_INFO_URL);
  }

  signOut() {
    return this._request(USER_SIGNOUT_URL, { method: "post" });
  }

  getWorkflows({
    pagination,
    search,
    status,
    sharedBy,
    sharedWith,
    sort,
    workflowIdOrName,
    shared,
    type,
  } = {}) {
    return this._request(
      WORKFLOWS_URL({
        ...(pagination ?? {}),
        workflow_id_or_name: workflowIdOrName,
        search,
        status,
        shared,
        shared_by: sharedBy,
        shared_with: sharedWith,
        sort,
        type,
      }),
    );
  }

  getWorkflowLogs(id) {
    return this._request(WORKFLOW_LOGS_URL(id));
  }

  getWorkflowFiles(id, pagination, search) {
    return this._request(WORKFLOW_FILES_URL(id, { ...pagination, search }));
  }

  getWorkflowFile(id, filename, { responseType } = {}) {
    let options = {};
    if (responseType) {
      options = { responseType };
    }
    return this._request(WORKFLOW_FILE_URL(id, filename), options);
  }

  getWorkflowSpec(id) {
    return this._request(WORKFLOW_SPECIFICATION_URL(id));
  }

  getWorkflowRetentionRules(id) {
    return this._request(WORKFLOW_RETENTION_RULES_URL(id));
  }

  pruneWorkspace(id, { includeInputs = false, includeOutputs = false } = {}) {
    return this._request(
      WORKFLOW_PRUNE_URL(id, {
        include_inputs: includeInputs,
        include_outputs: includeOutputs,
      }),
      {
        method: "post",
      },
    );
  }

  deleteWorkflow(id, { workspace, allRuns }) {
    return this._request(WORKFLOW_SET_STATUS_URL(id, { status: "deleted" }), {
      data: { workspace, all_runs: allRuns },
      method: "put",
    });
  }

  stopWorkflow(id) {
    return this._request(WORKFLOW_SET_STATUS_URL(id, { status: "stop" }), {
      method: "put",
    });
  }

  openInteractiveSession(id, { type = "jupyter", image } = {}) {
    return this._request(INTERACTIVE_SESSIONS_OPEN_URL(id, type), {
      data: { image },
      method: "post",
    });
  }

  getInteractiveSessionSecret(id) {
    return this._request(INTERACTIVE_SESSION_SECRET_URL(id));
  }

  closeInteractiveSession(id) {
    return this._request(INTERACTIVE_SESSIONS_CLOSE_URL(id), {
      method: "post",
    });
  }

  getGitlabProjects({ search, pagination } = {}) {
    return this._request(
      GITLAB_PROJECTS_URL({ ...(pagination ?? {}), search }),
    );
  }

  toggleGitlabProject(method, data) {
    return this._request(GITLAB_WEBHOOK_URL, { data, method });
  }

  getGitlabWebhookToken() {
    return this._request(GITLAB_WEBHOOK_TOKEN_URL);
  }

  renewGitlabWebhookToken() {
    return this._request(GITLAB_WEBHOOK_TOKEN_URL, { method: "put" });
  }

  getClusterStatus() {
    return this._request(CLUSTER_STATUS_URL);
  }

  launchWorkflow(data) {
    return this._request(LAUNCH_ON_REANA_URL, {
      data,
      method: "post",
    });
  }

  getUsersSharedWithYou() {
    return this._request(USERS_SHARED_WITH_YOU_URL);
  }

  getUsersYouSharedWith() {
    return this._request(USERS_YOU_SHARED_WITH_URL);
  }

  getWorkflowShareStatus(id) {
    return this._request(WORKFLOW_SHARE_STATUS_URL(id));
  }

  shareWorkflow(id, { userEmailToShareWith, validUntil }) {
    return this._request(WORKFLOW_SHARE_URL(id), {
      data: {
        user_email_to_share_with: userEmailToShareWith,
        valid_until: validUntil,
      },
      method: "post",
    });
  }

  unshareWorkflow(id, { userEmailToUnshareWith }) {
    return this._request(WORKFLOW_UNSHARE_URL(id), {
      data: { user_email_to_unshare_with: userEmailToUnshareWith },
      method: "post",
    });
  }
}

const client = new Client();
export default client;
