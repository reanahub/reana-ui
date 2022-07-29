/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/
import { sortBy } from "lodash";
import mime from "mime";
import moment from "moment";
import queryString from "query-string";

/**
 * Mapping between workflow statuses and colors and icons.
 */
export const statusMapping = {
  finished: { icon: "check circle", color: "green", preposition: "in" },
  running: { icon: "spinner", color: "blue", preposition: "for" },
  failed: { icon: "delete", color: "red", preposition: "after" },
  created: { icon: "file outline", color: "violet" },
  stopped: {
    icon: "pause circle outline",
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
export const healthMapping = {
  healthy: "green",
  warning: "brown",
  critical: "red",
};

/**
 * Parses API data into displayable data
 */
export function parseWorkflows(workflows) {
  if (!Array.isArray(workflows)) return [];
  // Convert array into object to avoid traversing the whole array.
  workflows = workflows.reduce((obj, workflow) => {
    const info = workflow.name.split(".");
    workflow.name = info.shift();
    workflow.run = info.join(".");
    const progress = workflow.progress.finished;
    const total = workflow.progress.total;
    workflow.completed = typeof progress === "object" ? progress.total : 0;
    workflow.total = total.total;
    workflow.launcherURL = workflow.launcher_url;
    workflow = parseWorkflowDates(workflow);
    workflow = parseWorkflowRetentionRules(workflow);

    obj[workflow.id] = workflow;
    return obj;
  }, {});

  return workflows;
}

/**
 * Parses workflow's retention rules.
 */
function parseWorkflowRetentionRules(workflow) {
  const getTimeBeforeExecution = (applyOn, currentTime) => {
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

  const retentionRules = workflow.retention_rules;
  if (!retentionRules) {
    return workflow;
  }
  delete workflow.retention_rules;
  const currentTime = moment.now();
  workflow.retentionRules = sortBy(
    retentionRules.map(
      ({ apply_on, retention_days, status, workspace_files }) => {
        const applyOn = apply_on ? moment(apply_on) : null;
        const timeBeforeExecution = applyOn
          ? getTimeBeforeExecution(applyOn, currentTime)
          : null;
        return {
          applyOn: applyOn ? applyOn.format("Do MMM YYYY HH:mm") : null,
          timeBeforeExecution,
          retentionDays: retention_days,
          workspaceFiles: workspace_files,
          status,
          created: status === "created",
          active: status === "active",
          inactive: status === "inactive",
          applied: status === "applied",
        };
      }
    ),
    [({ retentionDays }) => retentionDays]
  );
  return workflow;
}

/**
 * Format a given time duration.
 */
export function formatDuration(duration) {
  const durationMoment = moment.duration(duration);
  if (!durationMoment.isValid()) {
    return null;
  }
  let format;
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
export function getDuration(start, end) {
  const startMoment = moment.utc(start);
  if (startMoment.isValid()) {
    let endMoment = moment.utc(end);
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
function parseWorkflowDates(workflow) {
  const createdMoment = moment.utc(workflow.created);
  const startedMoment = moment.utc(workflow.progress.run_started_at);
  const finishedMoment = moment.utc(workflow.progress.run_finished_at);
  workflow.createdDate = createdMoment.format("Do MMM YYYY HH:mm");
  workflow.startedDate = startedMoment.format("Do MMM YYYY HH:mm");
  workflow.finishedDate = finishedMoment.format("Do MMM YYYY HH:mm");
  workflow.friendlyCreated = moment
    .duration(-moment().diff(createdMoment))
    .humanize(true);
  if (startedMoment.isValid()) {
    workflow.friendlyStarted = moment
      .duration(-moment().diff(startedMoment))
      .humanize(true);
    if (finishedMoment.isValid()) {
      workflow.friendlyFinished = moment
        .duration(-moment().diff(finishedMoment))
        .humanize(true);
    }

    workflow.duration = formatDuration(
      getDuration(startedMoment, finishedMoment)
    );
  }
  return workflow;
}

/**
 * Parses workflow logs.
 */
export function parseLogs(logs) {
  const parsedLogs = JSON.parse(logs);

  for (let job of Object.values(parsedLogs.job_logs)) {
    job.duration = formatDuration(getDuration(job.started_at, job.finished_at));
  }

  return {
    jobLogs: parsedLogs.job_logs,
    engineLogs: parsedLogs.workflow_logs,
  };
}

/**
 * Parses workflow files.
 */
export function parseFiles(files) {
  if (!Array.isArray(files)) return [];
  files.forEach((file) => {
    // TODO: Change on server side
    file["lastModified"] = file["last-modified"];
    delete file["last-modified"];
  });

  return files;
}

/**
 * Formats search input term.
 * @param {String} term Search term
 * @returns term format expected by the API.
 */
export function formatSearch(term) {
  return term ? JSON.stringify({ name: [term] }) : term;
}

/**
 * Returns mime-type of a given file name.
 * @param {String} fileName File name
 */
export function getMimeType(fileName) {
  // Formats not considered by mime npm package
  const WHITELIST = [".py", "Snakefile"];
  if (WHITELIST.find((ext) => fileName.endsWith(ext))) {
    return "text/plain";
  }
  return mime.getType(fileName);
}

/**
 * Stringify query params.
 */
export function stringifyQueryParams(params) {
  return queryString.stringify(params, {
    arrayFormat: "comma",
    skipNull: true,
    skipEmptyString: true,
  });
}
