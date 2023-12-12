/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios from "axios";

import { api } from "~/config";
import { stringifyQueryParams } from "~/util";

// URLs
export const CONFIG_URL = `${api}/api/config`;
export const USER_INFO_URL = `${api}/api/you`;
export const USER_SIGNUP_URL = `${api}/api/register`;
export const USER_OAUTH_SIGNIN_URL = (next, ssoProvider) =>
  `${api}/api/oauth/login/${ssoProvider}?${stringifyQueryParams({ next })}`;
export const USER_SIGNIN_URL = `${api}/api/login`;
export const USER_SIGNOUT_URL = `${api}/api/logout`;
export const USER_REQUEST_TOKEN_URL = `${api}/api/token`;
export const USER_CONFIRM_EMAIL_URL = `${api}/api/confirm-email`;
export const USERS_SHARED_WITH_YOU_URL = `${api}/api/users/shared-with-you`;
export const USERS_YOU_SHARED_WITH_URL = `${api}/api/users/you-shared-with`;
export const CLUSTER_STATUS_URL = `${api}/api/status`;
export const GITLAB_AUTH_URL = `${api}/api/gitlab/connect`;
export const GITLAB_PROJECTS_URL = `${api}/api/gitlab/projects`;
export const GITLAB_WEBHOOK_URL = `${api}/api/gitlab/webhook`;
export const WORKFLOWS_URL = (params) =>
  `${api}/api/workflows?verbose=true&${stringifyQueryParams(params)}`;
export const WORKFLOW_LOGS_URL = (id) => `${api}/api/workflows/${id}/logs`;
export const WORKFLOW_SPECIFICATION_URL = (id) =>
  `${api}/api/workflows/${id}/specification`;
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
export const INTERACTIVE_SESSION_URL = (sessionUri, reanaToken) =>
  `${api}${sessionUri}?token=${reanaToken}`;
export const LAUNCH_ON_REANA_URL = `${api}/api/launch`;

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
  async _request(
    url,
    { data = null, method = "get", withCredentials = true, ...options } = {},
  ) {
    return await axios({
      method,
      url,
      data,
      withCredentials,
      ...options,
    });
  }

  getConfig() {
    return this._request(CONFIG_URL);
  }

  getUser() {
    return this._request(USER_INFO_URL);
  }

  _sign(url, data) {
    return this._request(url, {
      data,
      method: "post",
      headers: { "Content-Type": "application/json" },
    });
  }

  signUp(data) {
    return this._sign(USER_SIGNUP_URL, data);
  }

  signIn(data) {
    return this._sign(USER_SIGNIN_URL, data);
  }

  signOut() {
    return this._request(USER_SIGNOUT_URL, { method: "post" });
  }

  requestToken() {
    return this._request(USER_REQUEST_TOKEN_URL, { method: "put" });
  }

  confirmEmail(data) {
    return this._request(USER_CONFIRM_EMAIL_URL, {
      data,
      method: "post",
      headers: { "Content-Type": "application/json" },
    });
  }

  getWorkflows({
    pagination,
    search,
    status,
    ownedBy,
    sharedWith,
    sort,
    workflowIdOrName,
  } = {}) {
    let shared = false;
    if (ownedBy === "anybody") {
      ownedBy = undefined;
      shared = true;
    } else if (ownedBy === "you") {
      ownedBy = undefined;
    }
    return this._request(
      WORKFLOWS_URL({
        ...(pagination ?? {}),
        workflow_id_or_name: workflowIdOrName,
        search,
        status,
        shared,
        shared_by: ownedBy,
        shared_with: sharedWith,
        sort,
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

  openInteractiveSession(id) {
    return this._request(INTERACTIVE_SESSIONS_OPEN_URL(id), { method: "post" });
  }

  closeInteractiveSession(id) {
    return this._request(INTERACTIVE_SESSIONS_CLOSE_URL(id), {
      method: "post",
    });
  }

  getGitlabProjects() {
    return this._request(GITLAB_PROJECTS_URL);
  }

  toggleGitlabProject(method, data) {
    return this._request(GITLAB_WEBHOOK_URL, { data, method });
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

  shareWorkflow(id, data) {
    return this._request(WORKFLOW_SHARE_URL(id), {
      data,
      method: "post",
    });
  }

  unshareWorkflow(id, data) {
    return this._request(WORKFLOW_UNSHARE_URL(id), {
      data,
      method: "post",
    });
  }
}

const client = new Client();
export default client;
