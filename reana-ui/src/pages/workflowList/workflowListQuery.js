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
    text: `${size}`,
    value: size,
  }),
);

export const WORKFLOW_LIST_DEFAULT_PAGE_SIZE =
  WORKFLOW_LIST_PAGE_SIZE_OPTIONS[1].value;

/**
 * Canonical sort orders, used both to validate the `sort` URL parameter and to
 * render the sorting dropdown.
 */
export const WORKFLOW_LIST_SORT_OPTIONS = [
  {
    key: "desc",
    text: "Latest first",
    value: "desc",
    icon: "sort amount down",
  },
  { key: "asc", text: "Oldest first", value: "asc", icon: "sort amount up" },
  {
    key: "disk-desc",
    text: "Highest disk usage",
    value: "disk-desc",
    icon: "hdd",
  },
  {
    key: "cpu-desc",
    text: "Highest CPU usage",
    value: "cpu-desc",
    icon: "microchip",
  },
];

export const WORKFLOW_LIST_DEFAULT_SORT = WORKFLOW_LIST_SORT_OPTIONS[0].value;

/**
 * Labels of the top-level workflow views.
 */
export const WORKFLOW_CATEGORY_LABELS = {
  mine: "Your workflows",
  "shared-with-me": "Shared with you",
};

const isPositiveInteger = (value) => Number.isFinite(value) && value > 0;
const isValidStatus = (status) =>
  status && WORKFLOW_STATUSES.includes(status) && status !== "deleted";
const isValidSort = (sort) =>
  WORKFLOW_LIST_SORT_OPTIONS.some((option) => option.value === sort);

/**
 * Normalized workflow list query state parsed from URL search parameters.
 *
 * URL Parameter Contract:
 * - page: positive integer or absent (default: 1)
 * - page-size: positive integer or absent (default: 10)
 * - search: string or absent
 * - sort: one of `WORKFLOW_LIST_SORT_OPTIONS` or absent (default: "desc")
 * - status: workflow status or absent
 * - show-deleted: "true" or absent
 * - open-sessions: "true" or absent
 *
 * Sharing (mutually exclusive; shared-with takes priority):
 * - shared-with: "nobody" | "anybody" | email — owned-workflow refinement
 * - owned-by: "anybody" | email — workflows not owned by the current user
 *
 * `category` is the derived top-level view discriminator: any `owned-by` value
 * means "Shared with you", everything else means "Your workflows". Derive view
 * decisions from it rather than re-reading the raw parameters.
 *
 * Legacy params (read-only, never written):
 * - ?shared=true              → ownedBy="anybody"
 * - ?shared-with=true         → sharedWith="anybody"
 * - ?shared-by=<email>        → ownedBy=<email>
 * - ?owned-by=you             → ownedBy=undefined (default "mine" view)
 *
 * Note that `?shared=true` (and `?owned-by=anybody`, which the previous
 * interface wrote for it) used to mean "workflows I own plus workflows shared
 * with me". The two views are now mutually exclusive, so such links
 * intentionally resolve to the narrower "shared with you" result set.
 *
 * Missing sharing params default to ownedBy=undefined (default "mine" view).
 */
export function parseWorkflowListQuery(searchParams) {
  const rawPage = Number.parseInt(searchParams.get("page") || "", 10);

  const rawPageSize = Number.parseInt(searchParams.get("page-size") || "", 10);
  const pageSize = isPositiveInteger(rawPageSize)
    ? rawPageSize
    : WORKFLOW_LIST_DEFAULT_PAGE_SIZE;

  const search = searchParams.get("search") || "";
  const rawSort = searchParams.get("sort");
  const sort = isValidSort(rawSort) ? rawSort : WORKFLOW_LIST_DEFAULT_SORT;

  const includeDeleted = searchParams.get("show-deleted") === "true";
  const showOpenSessionsOnly = searchParams.get("open-sessions") === "true";
  const rawStatus = searchParams.get("status");
  // Handle legacy "deleted" status filter, which is now represented by the "show-deleted" param.
  // We reset the page to 1 to avoid a data race
  const page =
    rawStatus === "deleted" || !isPositiveInteger(rawPage) ? 1 : rawPage;
  const status = isValidStatus(rawStatus) ? rawStatus : undefined;
  const hasStatusFilter =
    searchParams.has("status") && isValidStatus(rawStatus);

  // shared-with takes priority over owned-by
  const rawSharedWith = searchParams.get("shared-with");
  let sharedWith;
  if (rawSharedWith === "true")
    sharedWith = "anybody"; // legacy
  else if (rawSharedWith) sharedWith = rawSharedWith;
  else sharedWith = undefined;

  let ownedBy;
  if (sharedWith !== undefined) {
    ownedBy = undefined; // irrelevant when refining owned workflows
  } else {
    const rawOwnedBy = searchParams.get("owned-by");
    const rawSharedBy = searchParams.get("shared-by"); // legacy
    if (rawOwnedBy && rawOwnedBy !== "you") ownedBy = rawOwnedBy;
    else if (rawSharedBy)
      ownedBy = rawSharedBy; // legacy
    else if (searchParams.get("shared") === "true")
      ownedBy = "anybody"; // legacy
    else ownedBy = undefined;
  }

  return {
    page,
    pageSize,
    search,
    sort,
    includeDeleted,
    showOpenSessionsOnly,
    status,
    hasStatusFilter,
    ownedBy,
    sharedWith,
    category: ownedBy ? "shared-with-me" : "mine",
  };
}

/**
 * Serializes the normalized query model to API request parameters.
 */
export function serializeQueryToApiParams(query) {
  // `shared-with` refines the current user's own workflows; otherwise
  // `owned-by` ("anybody" or a specific email) selects workflows shared with
  // them. `shared` is always false — the owned/shared distinction is carried by
  // sharedBy / sharedWith below.
  const { sharedWith } = query;
  const ownedBy =
    sharedWith !== undefined ? undefined : query.ownedBy || undefined;

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
    shared: false,
    sharedBy: ownedBy,
    sharedWith,
    sort: query.sort,
    ...(query.showOpenSessionsOnly ? { type: "interactive" } : {}),
  };
}
