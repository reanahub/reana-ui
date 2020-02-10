/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";

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
