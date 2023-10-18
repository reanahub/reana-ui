/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

export const api = window.location.origin;

/**
 * Valid Launch-on-REANA querystring parameter keys.
 */
export const LAUNCH_ON_REANA_PARAMS_WHITELIST = {
  url: { required: true },
  name: { required: false },
  parameters: { required: false },
  specification: { required: false },
};

/**
 * Launch on REANA badge image URL.
 */
export const LAUNCH_ON_REANA_BADGE_URL =
  "https://www.reana.io/static/img/badges/launch-on-reana.svg";

/**
 * List of possible statuses of a workflow.
 */
export const WORKFLOW_STATUSES = [
  "created",
  "deleted",
  "failed",
  "finished",
  "pending",
  "queued",
  "running",
  "stopped",
];

/**
 * REANA quotas docs URL.
 */
export const REANA_QUOTAS_DOCS_URL =
  "https://docs.reana.io/advanced-usage/user-quotas";

/**
 * Statuses of workflows still waiting or in execution.
 */
export const NON_FINISHED_STATUSES = [
  "created",
  "queued",
  "pending",
  "running",
];

/**
 * List of possible statuses of a workflow, except for `deleted`.
 */
export const NON_DELETED_STATUSES = WORKFLOW_STATUSES.filter(
  (status) => status !== "deleted",
);

/**
 * List of HTML tags that can be present in an announcement.
 */
export const ALLOWED_HTML_TAGS_ANNOUNCEMENT = ["a", "b", "em", "i", "strong"];
