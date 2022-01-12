/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import mime from "mime";
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
  warning: "orange",
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
    workflow = parseWorkflowDates(workflow);

    obj[workflow.id] = workflow;
    return obj;
  }, {});

  return workflows;
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
  let duration;
  if (startedMoment.isValid()) {
    workflow.friendlyStarted = moment
      .duration(-moment().diff(startedMoment))
      .humanize(true);
    if (finishedMoment.isValid()) {
      duration = finishedMoment.diff(startedMoment);
      workflow.friendlyFinished = moment
        .duration(-moment().diff(finishedMoment))
        .humanize(true);
    } else if (startedMoment.isValid()) {
      duration = moment().diff(startedMoment);
    }

    const durationMoment = moment.duration(duration);
    let format;
    if (durationMoment.hours()) {
      format = "H[h] m[m] s[s]";
    } else if (durationMoment.minutes()) {
      format = "m [min] s [sec]";
    } else {
      format = "s [seconds]";
    }
    workflow.duration = moment.utc(duration).format(format);
  }
  return workflow;
}

/**
 * Parses workflow logs.
 */
export function parseLogs(logs) {
  const parsedLogs = JSON.parse(logs);
  return parsedLogs.job_logs;
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
