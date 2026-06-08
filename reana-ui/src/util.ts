/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/
import { sortBy } from "lodash";
import Mime from "mime/Mime";
import otherMimeTypes from "mime/types/other";
import standardMimeTypes from "mime/types/standard";
import moment, { Duration, Moment } from "moment";
import queryString from "query-string";

// ---------------------------------------------------------------------------
// Interfaces / type aliases
// ---------------------------------------------------------------------------

export interface WorkflowStatusInfo {
  icon: string;
  color: string;
  preposition?: string;
}

export interface RawWorkflowProgress {
  finished: { total: number } | null;
  total: { total: number };
  running: { total: number } | null;
  failed: { total: number } | null;
  run_started_at: string | null;
  run_finished_at: string | null;
  run_stopped_at: string | null;
}

/** Raw workflow object as returned by the API. */
export interface RawWorkflow {
  id: string;
  name: string;
  status: string;
  created: string;
  progress: RawWorkflowProgress;
  launcher_url?: string;
  owner_email?: string;
  shared_with?: string[];
  // Allow any additional API fields during migration
  [key: string]: unknown;
}

/** Parsed workflow object after `parseWorkflows` processing. */
export interface ParsedWorkflow {
  id: string;
  name: string;
  run: string;
  status: string;
  completed: number;
  total: number;
  running: number;
  failed: number;
  launcherURL?: string;
  ownerEmail?: string;
  sharedWith: string[];
  createdDate: string;
  startedDate: string;
  finishedDate: string;
  friendlyCreated: string;
  friendlyStarted?: string;
  friendlyFinished?: string;
  duration?: string | null;
  // Allow any additional fields carried over from the raw workflow
  [key: string]: unknown;
}

/** Keyed map of parsed workflows returned by `parseWorkflows`. */
export interface ParsedWorkflowMap {
  [id: string]: ParsedWorkflow;
}

export interface RawRetentionRule {
  apply_on: string | null;
  retention_days: number;
  status: string;
  workspace_files: string;
}

export interface ParsedRetentionRule {
  applyOn: string | null;
  timeBeforeExecution: string | null;
  retentionDays: number;
  workspaceFiles: string;
  status: string;
  created: boolean;
  active: boolean;
  inactive: boolean;
  pending: boolean;
  applied: boolean;
}

export interface RawJobLog {
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration?: string | null;
  // Allow any additional log fields
  [key: string]: unknown;
}

export interface ParsedLogs {
  jobLogs: { [jobId: string]: RawJobLog };
  engineLogs: string;
  serviceLogs: { [serviceId: string]: string };
}

export interface WorkspaceFile {
  name: string;
  "last-modified"?: string;
  lastModified?: string;
  size?: { raw: number; human_readable: string };
  // Allow any additional file fields
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
  status?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Mapping between workflow statuses and colors and icons.
 */
export const statusMapping: Record<string, WorkflowStatusInfo> = {
  finished: { icon: "check circle", color: "green", preposition: "in" },
  running: { icon: "spinner", color: "blue", preposition: "for" },
  failed: { icon: "delete", color: "red", preposition: "after" },
  created: { icon: "file outline", color: "violet" },
  stopped: {
    icon: "stop circle outline",
    color: "yellow",
    preposition: "after",
  },
  queued: { icon: "hourglass outline", color: "teal" },
  pending: { icon: "hourglass half", color: "teal" },
  deleted: { icon: "eraser", color: "grey" },
};

/**
 * Mapping between health statuses and Semantic-UI colors.
 */
export const healthMapping: Record<string, string> = {
  healthy: "green",
  warning: "brown",
  critical: "red",
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Parses API data into displayable data
 */
export function parseWorkflows(
  workflows: RawWorkflow[],
): ParsedWorkflowMap | [] {
  if (!Array.isArray(workflows)) return [];
  // Convert array into object to avoid traversing the whole array.
  const result = workflows.reduce<ParsedWorkflowMap>((obj, workflow) => {
    const info = workflow.name.split(".");
    const name = info.shift() as string;
    const run = info.join(".");
    const progress = workflow.progress.finished;
    const total = workflow.progress.total;
    const running = workflow.progress.running;
    const failed = workflow.progress.failed;
    const parsedWorkflow = {
      ...workflow,
      name,
      run,
      completed:
        typeof progress === "object" && progress !== null ? progress.total : 0,
      total: total.total,
      running:
        typeof running === "object" && running !== null ? running.total : 0,
      failed: typeof failed === "object" && failed !== null ? failed.total : 0,
      launcherURL: workflow.launcher_url,
      ownerEmail: workflow.owner_email,
      sharedWith: workflow.shared_with ?? [],
    } as unknown as ParsedWorkflow;
    const parsed = parseWorkflowDates(parsedWorkflow);

    obj[parsed.id as string] = parsed;
    return obj;
  }, {});

  return result;
}

/**
 * Parses workflow's retention rules.
 */
export function parseWorkflowRetentionRules(
  retentionRules: RawRetentionRule[],
): ParsedRetentionRule[] {
  const getTimeBeforeExecution = (
    applyOn: Moment,
    currentTime: number,
  ): string => {
    const diff = moment.duration(applyOn.diff(currentTime));
    if (diff.asDays() < 1) {
      return "soon";
    }
    // change rounding so that we always show a conservative (rounded down) estimate
    // of how much time is remaining before the execution of the rule
    let prevRounding = moment.relativeTimeRounding();
    moment.relativeTimeRounding(Math.floor);
    const thresholds = { d: 7, w: 5, M: 12 };
    const timeBeforeExecution = diff.humanize(true, thresholds);
    // restore rounding behaviour
    moment.relativeTimeRounding(prevRounding);
    return timeBeforeExecution;
  };

  if (!Array.isArray(retentionRules)) return [];
  const currentTime = moment.now();
  return sortBy(
    retentionRules.map(
      ({ apply_on, retention_days, status, workspace_files }) => {
        const applyOn = apply_on ? moment(apply_on) : null;
        const timeBeforeExecution = applyOn
          ? getTimeBeforeExecution(applyOn, currentTime)
          : null;
        return {
          applyOn: applyOn ? applyOn.format("YYYY-MM-DDTHH:mm:ss") : null,
          timeBeforeExecution,
          retentionDays: retention_days,
          workspaceFiles: workspace_files,
          status,
          created: status === "created",
          active: status === "active",
          inactive: status === "inactive",
          pending: status === "pending",
          applied: status === "applied",
        };
      },
    ),
    [({ retentionDays }) => retentionDays],
  );
}

/**
 * Format a given time duration.
 */
export function formatDuration(
  duration: Duration | null | undefined,
): string | null {
  if (duration == null) {
    // the function accepts nullish values so that the result of `getDuration`
    // can be passed directly to `formatDuration`
    return null;
  }
  const durationMoment = moment.duration(duration);
  if (!durationMoment.isValid()) {
    return null;
  }
  let format: string;
  if (durationMoment.hours()) {
    format = "H[h] m[m] s[s]";
  } else if (durationMoment.minutes()) {
    format = "m [min] s [sec]";
  } else {
    format = "s [seconds]";
  }
  return moment.utc(durationMoment.valueOf()).format(format);
}

/**
 * Calculate the time delta between the start and the end of an event.
 * If the end time is not a valid date (e.g. null), the duration is calculated from the
 * beginning of the event up to the current time.
 */
export function getDuration(
  start: Moment | string | null | undefined,
  end: string | Moment | null | undefined,
): Duration | null {
  const startMoment = moment.utc(start);
  if (startMoment.isValid()) {
    let endMoment = moment.utc(end as string);
    if (!endMoment.isValid()) {
      endMoment = moment.utc();
    }
    return moment.duration(endMoment.diff(startMoment));
  }
  return null;
}

/**
 * Parses workflows date info in a friendly way.
 */
export function parseWorkflowDates(workflow: ParsedWorkflow): ParsedWorkflow {
  const createdMoment = moment.utc(workflow.created as string);
  const startedMoment = moment.utc(
    (workflow.progress as unknown as RawWorkflowProgress).run_started_at,
  );
  const finishedMoment = moment.utc(
    (workflow.progress as unknown as RawWorkflowProgress).run_finished_at,
  );
  const stoppedMoment = moment.utc(
    (workflow.progress as unknown as RawWorkflowProgress).run_stopped_at,
  );
  // Mapping between workflow status and the end moment to use for calculating the duration
  // If the workflow has not terminated yet (running, queued, pending), the endMoment should not be
  // specified, and the current time will be used instead.
  const endMomentStatusMapping: Record<string, Moment> = {
    failed: finishedMoment,
    finished: finishedMoment,
    stopped: stoppedMoment,
    deleted: finishedMoment.isValid() ? finishedMoment : stoppedMoment,
  };

  const parsedWorkflow = {
    ...workflow,
    createdDate: createdMoment.format("Do MMM YYYY HH:mm"),
    startedDate: startedMoment.format("Do MMM YYYY HH:mm"),
    finishedDate: finishedMoment.format("Do MMM YYYY HH:mm"),
    friendlyCreated: moment
      .duration(-moment().diff(createdMoment))
      .humanize(true),
    friendlyStarted: undefined,
    friendlyFinished: undefined,
    duration: undefined,
  };

  if (startedMoment.isValid()) {
    parsedWorkflow.friendlyStarted = moment
      .duration(-moment().diff(startedMoment))
      .humanize(true);
    if (finishedMoment.isValid()) {
      parsedWorkflow.friendlyFinished = moment
        .duration(-moment().diff(finishedMoment))
        .humanize(true);
    }

    parsedWorkflow.duration = formatDuration(
      getDuration(
        startedMoment,
        endMomentStatusMapping[workflow.status as string],
      ),
    );
  }
  return parsedWorkflow;
}

/**
 * Parses workflow logs.
 */
export function parseLogs(logs: string): ParsedLogs {
  const parsedLogs = JSON.parse(logs);

  for (let job of Object.values(parsedLogs.job_logs) as RawJobLog[]) {
    if (job.status === "stopped") {
      // Hide the duration of the job, because in the job object
      // there is no info about when the job (or the workflow) was stopped.
      job.duration = null;
    } else {
      job.duration = formatDuration(
        getDuration(job.started_at, job.finished_at),
      );
    }
  }
  return {
    jobLogs: parsedLogs.job_logs,
    engineLogs: parsedLogs.workflow_logs,
    serviceLogs: parsedLogs.service_logs,
  };
}

/**
 * Parses workflow files.
 */
export function parseFiles(files: WorkspaceFile[]): WorkspaceFile[] {
  if (!Array.isArray(files)) return [];
  return files.map((file) => {
    const { "last-modified": rawLastModified, lastModified, ...rest } = file;
    return {
      ...rest,
      // TODO: Change on server side
      lastModified: rawLastModified ?? lastModified,
    };
  });
}

/**
 * Formats search input term.
 * @param {String} term Search term
 * @returns term format expected by the API.
 */
export function formatSearch(
  term: string | null | undefined,
): string | null | undefined {
  return term ? JSON.stringify({ name: [term] }) : term;
}

/**
 * Format file size with human-readable units.
 * @param {Number} size File size in bytes.
 * @returns The formatted human-readable file size.
 */
export function formatFileSize(size: number, digits: number = 2): string {
  if (size === 0) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];
  const k = 1024;

  const unitIndex = Math.floor(Math.log(Math.abs(size)) / Math.log(k));
  const convertedValue = Number((size / k ** unitIndex).toFixed(digits));
  return `${convertedValue} ${units[unitIndex]}`;
}

/**
 * Custom mapping between MIME types and file extensions.
 *
 * A local instance of `Mime` is initialized in the same way as the global `mime` mapping,
 * adding some additional custom MIME types needed by REANA.
 *
 * `mime.define(...)` is not used in order to avoid modifying the global `mime` variable.
 */
const customMime = new Mime(standardMimeTypes, otherMimeTypes, {
  // ROOT does not have a registered MIME-type yet
  // See https://github.com/root-project/root/issues/6771
  "application/x-root": ["root"],
  "text/x-python": ["py"],
  "text/x-gherkin": ["feature"],
  "text/plain": ["out", "err"],
});

/**
 * Returns mime-type of a given file name.
 * @param {String} fileName File name
 */
export function getMimeType(fileName: string): string | null {
  // `Snakefile` does not have any extension,
  // so it needs to be handled manually
  if (fileName.endsWith("Snakefile")) {
    return "text/plain";
  }
  return customMime.getType(fileName);
}

/**
 * Stringify query params.
 */
export function stringifyQueryParams(params: PaginationParams): string {
  return queryString.stringify(params, {
    arrayFormat: "comma",
    skipNull: true,
    skipEmptyString: true,
  });
}
