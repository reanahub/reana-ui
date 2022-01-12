/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022 CERN.

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
export const USER_OAUTH_SIGNIN_URL = `${api}/oauth/login/cern`;
export const USER_SIGNIN_URL = `${api}/api/login`;
export const USER_SIGNOUT_URL = `${api}/api/logout`;
export const USER_REQUEST_TOKEN_URL = `${api}/api/token`;
export const USER_CONFIRM_EMAIL_URL = `${api}/api/confirm-email`;
export const CLUSTER_STATUS_URL = `${api}/api/status`;
export const GITLAB_AUTH_URL = `${api}/api/gitlab/connect`;
export const GITLAB_PROJECTS_URL = `${api}/api/gitlab/projects`;
export const GITLAB_WEBHOOK_URL = `${api}/api/gitlab/webhook`;
export const WORKFLOWS_URL = (params) =>
  `${api}/api/workflows?verbose=true&${stringifyQueryParams(params)}`;
export const WORKFLOW_LOGS_URL = (id) => `${api}/api/workflows/${id}/logs`;
export const WORKFLOW_SPECIFICATION_URL = (id) =>
  `${api}/api/workflows/${id}/specification`;
export const WORKFLOW_FILES_URL = (id, params) =>
  `${api}/api/workflows/${id}/workspace?${stringifyQueryParams(params)}`;
export const WORKFLOW_FILE_URL = (id, filename, preview = true) =>
  `${api}/api/workflows/${id}/workspace/${filename}?${stringifyQueryParams(
    preview
  )}`;
export const WORKFLOW_SET_STATUS_URL = (id, status) =>
  `${api}/api/workflows/${id}/status?${stringifyQueryParams(status)}`;
export const INTERACTIVE_SESSIONS_OPEN_URL = (id, type = "jupyter") =>
  `${api}/api/workflows/${id}/open/${type}`;
export const INTERACTIVE_SESSIONS_CLOSE_URL = (id) =>
  `${api}/api/workflows/${id}/close/`;
export const INTERACTIVE_SESSION_URL = (sessionUri, reanaToken) =>
  `${api}${sessionUri}?token=${reanaToken}`;

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
    { data = null, method = "get", withCredentials = true, ...options } = {}
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

  getWorkflows(pagination, search, status, sort) {
    return this._request(
      WORKFLOWS_URL({
        ...pagination,
        search,
        status,
        sort,
      })
    );
  }

  getWorkflowLogs(id) {
    return this._request(WORKFLOW_LOGS_URL(id));
  }

  getWorkflowFiles(id, pagination, search) {
    return this._request(WORKFLOW_FILES_URL(id, { ...pagination, search }));
  }

  getWorkflowFile(id, filename) {
    return this._request(WORKFLOW_FILE_URL(id, filename));
  }

  getWorkflowSpec(id) {
    return this._request(WORKFLOW_SPECIFICATION_URL(id));
  }

  deleteWorkflow(id, data) {
    return this._request(WORKFLOW_SET_STATUS_URL(id, { status: "deleted" }), {
      data,
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
}

export default new Client();
