/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { NON_DELETED_STATUSES, WORKFLOW_STATUSES } from "~/config";

export const WORKFLOW_LIST_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100].map(
  (size) => ({
    key: size,
    text: String(size),
    value: size,
  }),
);

export const WORKFLOW_LIST_DEFAULT_PAGE_SIZE =
  WORKFLOW_LIST_PAGE_SIZE_OPTIONS[1].value;

export const WORKFLOW_LIST_CATEGORIES = [
  "all",
  "mine",
  "shared-with-me",
  "i-shared",
];
export const WORKFLOW_LIST_DEFAULT_CATEGORY = "all";

const isPositiveInteger = (value: unknown): boolean =>
  Number.isFinite(value) && (value as number) > 0;
const isValidStatus = (status: unknown): boolean =>
  !!status && WORKFLOW_STATUSES.includes(status as any) && status !== "deleted";

export interface WorkflowListQuery {
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  category: string;
  includeDeleted: boolean;
  showOpenSessionsOnly: boolean;
  status: string | undefined;
  hasStatusFilter: boolean;
  sharedByUser: string | undefined;
  sharedWithUser: string | undefined;
}

export interface ApiRequestParams {
  pagination: { page: number; size: number };
  search: string | undefined;
  status: any;
  shared: boolean;
  sharedBy: string | undefined;
  sharedWith: string | undefined;
  sort: string;
  type?: string;
}

/**
 * Normalized workflow list query state parsed from URL search parameters.
 *
 * URL Parameter Contract:
 * - category: "all" | "mine" | "shared-with-me" | "i-shared" or absent (default: "all")
 * - page: positive integer or absent (default: 1)
 * - page-size: positive integer or absent (default: 10)
 * - search: string or absent
 * - sort: "asc" | "desc" | "disk-desc" | "cpu-desc" or absent (default: "desc")
 * - status: workflow status or absent
 * - show-deleted: "true" or absent
 * - open-sessions: "true" or absent
 *
 * Shared-with-me category only:
 * - shared-by: user email or absent (default: anybody)
 *
 * I-shared category only:
 * - shared-with-user: user email or absent (default: anybody)
 *
 */
export function parseWorkflowListQuery(
  searchParams: URLSearchParams,
): WorkflowListQuery {
  const rawPage = Number.parseInt(searchParams.get("page") || "", 10);
  const page = isPositiveInteger(rawPage) ? rawPage : 1;

  const rawPageSize = Number.parseInt(searchParams.get("page-size") || "", 10);
  const pageSize = isPositiveInteger(rawPageSize)
    ? rawPageSize
    : WORKFLOW_LIST_DEFAULT_PAGE_SIZE;

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "desc";

  // Determine category. Explicit ?category= takes priority
  const rawCategory = searchParams.get("category");
  let category;
  if (WORKFLOW_LIST_CATEGORIES.includes(rawCategory)) {
    category = rawCategory;
  } else if (searchParams.get("shared-with") === "true") {
    category = "i-shared";
  } else if (
    searchParams.get("shared") === "true" ||
    searchParams.get("shared-by")
  ) {
    category = "shared-with-me";
  } else {
    category = WORKFLOW_LIST_DEFAULT_CATEGORY;
  }

  const includeDeleted = searchParams.get("show-deleted") === "true";
  const showOpenSessionsOnly = searchParams.get("open-sessions") === "true";
  const rawStatus = searchParams.get("status");
  const status = isValidStatus(rawStatus) ? rawStatus : undefined;
  const hasStatusFilter =
    searchParams.has("status") && isValidStatus(rawStatus);

  // User filter for "shared with me" category (who shared with me)
  const sharedByUser =
    category === "shared-with-me"
      ? searchParams.get("shared-by") || "anybody"
      : undefined;

  // User filter for "i shared" category (who I shared with)
  const sharedWithUser =
    category === "i-shared"
      ? searchParams.get("shared-with-user") || "anybody"
      : undefined;

  return {
    page,
    pageSize,
    search,
    sort,
    category,
    includeDeleted,
    showOpenSessionsOnly,
    status,
    hasStatusFilter,
    sharedByUser,
    sharedWithUser,
  };
}

/**
 * Serializes the normalized query model to API request parameters.
 * The active category drives which shared/sharedBy/sharedWith API params are sent.
 */
export function serializeQueryToApiParams(
  query: WorkflowListQuery,
): ApiRequestParams {
  let shared, sharedBy, sharedWith;

  if (query.category === "all") {
    // Union of owned + shared-with-me workflows.
    shared = true;
    sharedBy = undefined;
    sharedWith = undefined;
  } else if (query.category === "shared-with-me") {
    // shared_by="anybody" returns ONLY workflows others shared with me (not the union).
    shared = false;
    sharedBy = query.sharedByUser || "anybody";
    sharedWith = undefined;
  } else if (query.category === "i-shared") {
    shared = false;
    sharedBy = undefined;
    // Backend expects the string "anybody", not a boolean.
    sharedWith = query.sharedWithUser || "anybody";
  } else {
    // "mine" category
    shared = false;
    sharedBy = undefined;
    sharedWith = undefined;
  }

  let status;
  if (query.hasStatusFilter) {
    status = query.includeDeleted
      ? query.status
        ? [query.status, "deleted"]
        : ["deleted"]
      : query.status
        ? [query.status]
        : undefined;
  } else {
    status = query.includeDeleted ? undefined : NON_DELETED_STATUSES;
  }

  return {
    pagination: {
      page: query.page,
      size: query.pageSize,
    },
    search: query.search.trim() || undefined,
    status,
    shared,
    sharedBy,
    sharedWith,
    sort: query.sort,
    ...(query.showOpenSessionsOnly ? { type: "interactive" } : {}),
  };
}
