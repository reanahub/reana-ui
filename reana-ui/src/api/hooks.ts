/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

/**
 * Typed wrapper hooks over Orval-generated hooks.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Orval v8 with client:'react-query' wraps every 200 body type as
 *   `BodyType & { headers: Headers }`
 * because it models its default fetch client. Our custom Axios mutator
 * returns only `response.data`, so the generated type doesn't match
 * reality. Rather than casting in every component, we do it once here.
 *
 * USAGE
 * -----
 * Import from '~/api/hooks', never from '~/api/generated' directly.
 * That boundary lets us regenerate generated.ts freely without touching
 * any component.
 */

// Re-export query key helpers needed for cache invalidation
export {
  getGetWorkflowsQueryKey,
  getGetWorkflowLogsQueryKey,
  getGetFilesQueryKey,
  getGetWorkflowShareStatusQueryKey,
  getGetWorkflowRetentionRulesQueryKey,
  getGetWorkflowSpecificationQueryKey,
  getGetYouQueryKey,
} from "./generated";

// Re-export params types so components don't need to import generated.ts
export type {
  GetWorkflowsParams,
  GetWorkflowLogsParams,
  GetFilesParams,
  GitlabProjectsParams,
  InfoParams,
} from "./generated";

import type { UseQueryOptions } from "@tanstack/react-query";
import { formatSearch } from "~/util";

/** Partial React Query options forwarded to generated hooks (e.g. refetchInterval). */
type QueryOpts<TData> = {
  query?: Partial<UseQueryOptions<unknown, unknown, TData>>;
};

import {
  // Hook imports
  useGetConfig as useGetConfigRaw,
  useGetYou as useGetYouRaw,
  useStatus as useStatusRaw,
  useInfo as useInfoRaw,
  useGetWorkflows as useGetWorkflowsRaw,
  useGetUsersSharedWithYou as useGetUsersSharedWithYouRaw,
  useGetUsersYouSharedWith as useGetUsersYouSharedWithRaw,
  useGetWorkflowLogs as useGetWorkflowLogsRaw,
  useGetFiles as useGetFilesRaw,
  useGetWorkflowSpecification as useGetWorkflowSpecificationRaw,
  useGetWorkflowRetentionRules as useGetWorkflowRetentionRulesRaw,
  useGetWorkflowShareStatus as useGetWorkflowShareStatusRaw,
  useGitlabProjects as useGitlabProjectsRaw,
  // Body types
  type GetConfig200,
  type GetYou200,
  type Status200,
  type Info200,
  type GetWorkflows200,
  type GetUsersSharedWithYou200,
  type GetUsersYouSharedWith200,
  type GetWorkflowLogs200,
  type GetFiles200,
  type GetWorkflowSpecification200,
  type GetWorkflowRetentionRules200,
  type GetWorkflowShareStatus200,
  type GitlabProjects200,
  // Params types (for passing through)
  type GetWorkflowsParams,
  type GetWorkflowLogsParams,
  type GetFilesParams,
  type GitlabProjectsParams,
  type InfoParams,
} from "./generated";

/**
 * Strips the `& { headers: Headers }` wrapper that Orval adds to success
 * response types, returning just the body. Our Axios mutator returns only
 * response.data so this matches what components actually receive.
 */
type Body<T> = T extends { headers: Headers } ? Omit<T, "headers"> : T;

function normalizeSearchParam(search: string | undefined): string | undefined {
  return formatSearch(search) ?? undefined;
}

export function normalizeUsersResponse<T extends Record<string, unknown>>(
  data: T | undefined,
  legacyKey: string,
): (T & { users?: unknown }) | undefined {
  if (!data) return undefined;
  return {
    ...data,
    users: data.users ?? data[legacyKey],
  };
}

// ─── Cluster / infra ─────────────────────────────────────────────────────────

export function useGetConfig() {
  // retry: false — a 401 on /api/config means not signed in, not a transient
  // error; retrying would cause redirect loops on the signin page.
  const result = useGetConfigRaw(undefined, { query: { retry: false } });
  return { ...result, data: result.data as Body<GetConfig200> | undefined };
}

export function useStatus() {
  const result = useStatusRaw();
  return { ...result, data: result.data as Body<Status200> | undefined };
}

export function useInfo(params: InfoParams) {
  const result = useInfoRaw(params);
  return { ...result, data: result.data as Body<Info200> | undefined };
}

// ─── Auth / user ─────────────────────────────────────────────────────────────

export function useGetYou() {
  // retry: false — 401 means "not signed in", not a transient error.
  // Retrying would compound the redirect loop triggered by onUnauthorized.
  const result = useGetYouRaw(undefined, { query: { retry: false } });
  return { ...result, data: result.data as Body<GetYou200> | undefined };
}

// ─── Workflow list ────────────────────────────────────────────────────────────

// GetWorkflowsParams marks `type` required, but the backend accepts it absent.
export type WorkflowsParams = Omit<GetWorkflowsParams, "type"> & {
  type?: string;
};

export function normalizeWorkflowsParams(
  params: WorkflowsParams,
): GetWorkflowsParams {
  return {
    ...params,
    search: normalizeSearchParam(params.search),
  } as GetWorkflowsParams;
}

export function normalizeFilesParams(params: GetFilesParams): GetFilesParams {
  return {
    ...params,
    search: normalizeSearchParam(params.search),
  };
}

export function useGetWorkflows(
  params: WorkflowsParams,
  opts?: QueryOpts<Body<GetWorkflows200>>,
) {
  const normalizedParams = normalizeWorkflowsParams(params);
  const result = useGetWorkflowsRaw(normalizedParams, opts as any);
  return { ...result, data: result.data as Body<GetWorkflows200> | undefined };
}

export function useGetUsersSharedWithYou() {
  const result = useGetUsersSharedWithYouRaw();
  return {
    ...result,
    data: normalizeUsersResponse(
      result.data as Body<GetUsersSharedWithYou200> | undefined,
      "users_shared_with_you",
    ) as Body<GetUsersSharedWithYou200> | undefined,
  };
}

export function useGetUsersYouSharedWith() {
  const result = useGetUsersYouSharedWithRaw();
  return {
    ...result,
    data: normalizeUsersResponse(
      result.data as Body<GetUsersYouSharedWith200> | undefined,
      "users_you_shared_with",
    ) as Body<GetUsersYouSharedWith200> | undefined,
  };
}

// ─── Workflow detail ──────────────────────────────────────────────────────────

export function useGetWorkflowLogs(
  workflowIdOrName: string,
  params?: GetWorkflowLogsParams,
) {
  // The generated hook has an optional `body` (string[] filter) before params;
  // we don't use that filter in the UI so we pass undefined.
  const result = useGetWorkflowLogsRaw(workflowIdOrName, undefined, params);
  return {
    ...result,
    data: result.data as Body<GetWorkflowLogs200> | undefined,
  };
}

export function useGetFiles(
  workflowIdOrName: string,
  params: GetFilesParams,
  opts?: QueryOpts<Body<GetFiles200>>,
) {
  const result = useGetFilesRaw(
    workflowIdOrName,
    normalizeFilesParams(params),
    opts as any,
  );
  return { ...result, data: result.data as Body<GetFiles200> | undefined };
}

export function useGetWorkflowSpecification(workflowIdOrName: string) {
  const result = useGetWorkflowSpecificationRaw(workflowIdOrName);
  return {
    ...result,
    data: result.data as Body<GetWorkflowSpecification200> | undefined,
  };
}

export function useGetWorkflowRetentionRules(workflowIdOrName: string) {
  const result = useGetWorkflowRetentionRulesRaw(workflowIdOrName);
  return {
    ...result,
    data: result.data as Body<GetWorkflowRetentionRules200> | undefined,
  };
}

export function useGetWorkflowShareStatus(workflowIdOrName: string) {
  const result = useGetWorkflowShareStatusRaw(workflowIdOrName);
  return {
    ...result,
    data: result.data as Body<GetWorkflowShareStatus200> | undefined,
  };
}

// ─── GitLab ───────────────────────────────────────────────────────────────────

export function useGitlabProjects(params?: GitlabProjectsParams) {
  const result = useGitlabProjectsRaw(params);
  return {
    ...result,
    data: result.data as Body<GitlabProjects200> | undefined,
  };
}
