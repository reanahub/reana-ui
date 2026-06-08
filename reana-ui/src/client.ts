/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios, { AxiosResponse } from "axios";

import { api } from "~/config";
import { PaginationParams, stringifyQueryParams } from "~/util";

export function isNoActiveTokensError(error: unknown): boolean {
  const status = (error as any)?.response?.status;
  const message = ((error as any)?.response?.data?.message || "").toLowerCase();
  return (
    (status === 401 || status === 403) && message.includes("no active tokens")
  );
}

export function isSessionExpiredError(error: unknown): boolean {
  const status = (error as any)?.response?.status;
  const message = ((error as any)?.response?.data?.message || "").toLowerCase();
  return (
    status === 401 &&
    (message.includes("user not signed in") ||
      message.includes("user not logged in"))
  );
}

// URLs
export const CONFIG_URL = `${api}/api/config`;
export const USER_INFO_URL = `${api}/api/you`;
export const CLUSTER_INFO_URL = `${api}/api/info`;
export const USER_SIGNUP_URL = `${api}/api/register`;
export const USER_OAUTH_SIGNIN_URL = (
  next: string,
  ssoProvider: string,
): string =>
  `${api}/api/oauth/login/${ssoProvider}?${stringifyQueryParams({ next })}`;
export const USER_SIGNIN_URL = `${api}/api/login`;
export const USER_SIGNOUT_URL = `${api}/api/logout`;
export const USER_REQUEST_TOKEN_URL = `${api}/api/token`;
export const USER_CONFIRM_EMAIL_URL = `${api}/api/confirm-email`;
export const USERS_SHARED_WITH_YOU_URL = `${api}/api/users/shared-with-you`;
export const USERS_YOU_SHARED_WITH_URL = `${api}/api/users/you-shared-with`;
export const CLUSTER_STATUS_URL = `${api}/api/status`;
export const GITLAB_AUTH_URL = `${api}/api/gitlab/connect`;
export const GITLAB_PROJECTS_URL = (params: PaginationParams): string =>
  `${api}/api/gitlab/projects?${stringifyQueryParams(params)}`;
export const GITLAB_WEBHOOK_URL = `${api}/api/gitlab/webhook`;
export const WORKFLOWS_URL = (params: PaginationParams): string =>
  `${api}/api/workflows?verbose=true&${stringifyQueryParams(params)}`;
export const WORKFLOW_LOGS_URL = (id: string): string =>
  `${api}/api/workflows/${id}/logs`;
export const WORKFLOW_SPECIFICATION_URL = (id: string): string =>
  `${api}/api/workflows/${id}/specification`;
export const WORKFLOW_PRUNE_URL = (
  id: string,
  params: PaginationParams,
): string => `${api}/api/workflows/${id}/prune?${stringifyQueryParams(params)}`;
export const WORKFLOW_RETENTION_RULES_URL = (id: string): string =>
  `${api}/api/workflows/${id}/retention_rules`;
export const WORKFLOW_FILES_URL = (
  id: string,
  params: PaginationParams,
): string =>
  `${api}/api/workflows/${id}/workspace?${stringifyQueryParams(params)}`;
export const WORKFLOW_FILE_URL = (
  id: string,
  filename: string,
  preview: boolean | Record<string, boolean> = true,
): string =>
  `${api}/api/workflows/${id}/workspace/${filename}?${stringifyQueryParams(
    preview as unknown as PaginationParams,
  )}`;
export const WORKFLOW_SET_STATUS_URL = (
  id: string,
  status: PaginationParams,
): string =>
  `${api}/api/workflows/${id}/status?${stringifyQueryParams(status)}`;
export const WORKFLOW_SHARE_STATUS_URL = (id: string): string =>
  `${api}/api/workflows/${id}/share-status`;
export const WORKFLOW_SHARE_URL = (id: string): string =>
  `${api}/api/workflows/${id}/share`;
export const WORKFLOW_UNSHARE_URL = (id: string): string =>
  `${api}/api/workflows/${id}/unshare`;
export const INTERACTIVE_SESSIONS_OPEN_URL = (
  id: string,
  type = "jupyter",
): string => `${api}/api/workflows/${id}/open/${type}`;
export const INTERACTIVE_SESSIONS_CLOSE_URL = (id: string): string =>
  `${api}/api/workflows/${id}/close/`;
export const INTERACTIVE_SESSION_URL = (
  sessionUri: string,
  reanaToken: string,
): string => `${api}${sessionUri}?token=${reanaToken}`;
export const DASK_DASHBOARD_URL = (workflow_id: string): string =>
  `${api}/${workflow_id}/dashboard/status`;
export const LAUNCH_ON_REANA_URL = `${api}/api/launch`;

interface RequestOptions {
  data?: any;
  method?: string;
  withCredentials?: boolean;
  headers?: Record<string, string>;
  responseType?: import("axios").ResponseType;
  [key: string]: any;
}

interface GetWorkflowsParams {
  pagination?: Partial<PaginationParams>;
  search?: string;
  status?: string | string[];
  sharedBy?: string;
  sharedWith?: string;
  sort?: string;
  workflowIdOrName?: string;
  shared?: boolean;
  type?: string;
}

class Client {
  /**
   * Encapsulates all network calls so the HTTP library is independent from
   * Redux/React lifecycle. Methods return Promises to be handled upstream.
   */
  private _onUnauthorized: (() => void) | null;

  constructor() {
    this._onUnauthorized = null;
  }

  setOnUnauthorized(callback: () => void): void {
    this._onUnauthorized = callback;
  }

  async _request(
    url: string,
    {
      data = null,
      method = "get",
      withCredentials = true,
      ...options
    }: RequestOptions = {},
  ): Promise<AxiosResponse> {
    try {
      return await axios({
        method,
        url,
        data,
        withCredentials,
        ...options,
      });
    } catch (error) {
      if (this._onUnauthorized && isSessionExpiredError(error)) {
        this._onUnauthorized();
      }
      throw error;
    }
  }

  getConfig(): Promise<AxiosResponse> {
    return this._request(CONFIG_URL);
  }

  getUser(): Promise<AxiosResponse> {
    return this._request(USER_INFO_URL);
  }

  getClusterInfo(): Promise<AxiosResponse> {
    return this._request(CLUSTER_INFO_URL);
  }

  _sign(url: string, data: Record<string, string>): Promise<AxiosResponse> {
    const formData = new URLSearchParams(data);
    return this._request(url, {
      data: formData,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  signUp(data: Record<string, string>): Promise<AxiosResponse> {
    return this._sign(USER_SIGNUP_URL, data);
  }

  signIn(data: Record<string, string>): Promise<AxiosResponse> {
    return this._sign(USER_SIGNIN_URL, data);
  }

  signOut(): Promise<AxiosResponse> {
    return this._request(USER_SIGNOUT_URL, { method: "post" });
  }

  requestToken(): Promise<AxiosResponse> {
    return this._request(USER_REQUEST_TOKEN_URL, { method: "put" });
  }

  confirmEmail(data: Record<string, string>): Promise<AxiosResponse> {
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
    sharedBy,
    sharedWith,
    sort,
    workflowIdOrName,
    shared,
    type,
  }: GetWorkflowsParams = {}): Promise<AxiosResponse> {
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
      } as PaginationParams),
    );
  }

  getWorkflowLogs(id: string): Promise<AxiosResponse> {
    return this._request(WORKFLOW_LOGS_URL(id));
  }

  getWorkflowFiles(
    id: string,
    pagination?: Partial<PaginationParams>,
    search?: string,
  ): Promise<AxiosResponse> {
    return this._request(
      WORKFLOW_FILES_URL(id, { ...pagination, search } as PaginationParams),
    );
  }

  getWorkflowFile(
    id: string,
    filename: string,
    { responseType }: { responseType?: import("axios").ResponseType } = {},
  ): Promise<AxiosResponse> {
    const options: RequestOptions = {};
    if (responseType) {
      options.responseType = responseType;
    }
    return this._request(WORKFLOW_FILE_URL(id, filename), options);
  }

  getWorkflowSpec(id: string): Promise<AxiosResponse> {
    return this._request(WORKFLOW_SPECIFICATION_URL(id));
  }

  getWorkflowRetentionRules(id: string): Promise<AxiosResponse> {
    return this._request(WORKFLOW_RETENTION_RULES_URL(id));
  }

  pruneWorkspace(
    id: string,
    {
      includeInputs = false,
      includeOutputs = false,
    }: { includeInputs?: boolean; includeOutputs?: boolean } = {},
  ): Promise<AxiosResponse> {
    return this._request(
      WORKFLOW_PRUNE_URL(id, {
        include_inputs: includeInputs,
        include_outputs: includeOutputs,
      } as unknown as PaginationParams),
      { method: "post" },
    );
  }

  deleteWorkflow(
    id: string,
    { workspace, allRuns }: { workspace?: boolean; allRuns?: boolean },
  ): Promise<AxiosResponse> {
    return this._request(
      WORKFLOW_SET_STATUS_URL(id, {
        status: "deleted",
      } as unknown as PaginationParams),
      { data: { workspace, all_runs: allRuns }, method: "put" },
    );
  }

  stopWorkflow(id: string): Promise<AxiosResponse> {
    return this._request(
      WORKFLOW_SET_STATUS_URL(id, {
        status: "stop",
      } as unknown as PaginationParams),
      { method: "put" },
    );
  }

  openInteractiveSession(
    id: string,
    { type = "jupyter", image }: { type?: string; image?: string } = {},
  ): Promise<AxiosResponse> {
    return this._request(INTERACTIVE_SESSIONS_OPEN_URL(id, type), {
      data: { image },
      method: "post",
    });
  }

  closeInteractiveSession(id: string): Promise<AxiosResponse> {
    return this._request(INTERACTIVE_SESSIONS_CLOSE_URL(id), {
      method: "post",
    });
  }

  getGitlabProjects({
    search,
    pagination,
  }: {
    search?: string;
    pagination?: Partial<PaginationParams>;
  } = {}): Promise<AxiosResponse> {
    return this._request(
      GITLAB_PROJECTS_URL({
        ...(pagination ?? {}),
        search,
      } as PaginationParams),
    );
  }

  toggleGitlabProject(method: string, data: unknown): Promise<AxiosResponse> {
    return this._request(GITLAB_WEBHOOK_URL, { data, method });
  }

  getClusterStatus(): Promise<AxiosResponse> {
    return this._request(CLUSTER_STATUS_URL);
  }

  launchWorkflow(data: unknown): Promise<AxiosResponse> {
    return this._request(LAUNCH_ON_REANA_URL, { data, method: "post" });
  }

  getUsersSharedWithYou(): Promise<AxiosResponse> {
    return this._request(USERS_SHARED_WITH_YOU_URL);
  }

  getUsersYouSharedWith(): Promise<AxiosResponse> {
    return this._request(USERS_YOU_SHARED_WITH_URL);
  }

  getWorkflowShareStatus(id: string): Promise<AxiosResponse> {
    return this._request(WORKFLOW_SHARE_STATUS_URL(id));
  }

  shareWorkflow(
    id: string,
    {
      userEmailToShareWith,
      validUntil,
    }: { userEmailToShareWith: string; validUntil?: string },
  ): Promise<AxiosResponse> {
    return this._request(WORKFLOW_SHARE_URL(id), {
      data: {
        user_email_to_share_with: userEmailToShareWith,
        valid_until: validUntil,
      },
      method: "post",
    });
  }

  unshareWorkflow(
    id: string,
    { userEmailToUnshareWith }: { userEmailToUnshareWith: string },
  ): Promise<AxiosResponse> {
    return this._request(WORKFLOW_UNSHARE_URL(id), {
      data: { user_email_to_unshare_with: userEmailToUnshareWith },
      method: "post",
    });
  }
}

const client = new Client();
export default client;
