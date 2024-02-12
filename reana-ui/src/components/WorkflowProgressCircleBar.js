/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import styles from "./WorkflowProgressCircleBar.module.scss";

export default function WorkflowProgressCircleBar({ workflow }) {
  const { completed, failed, running, total, status } = workflow;

  const size = 80;
  const strokeWidth = 10;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let lengthFinishedArc = (completed / total) * circumference;
  let lengthRunningArc = (running / total) * circumference;
  let lengthFailedArc = (failed / total) * circumference;
  // Explicitly set the size of the progress bar for workflows that
  // are not running to avoid dealing with undefined number of steps
  const TERMINAL_STATUSES = ["finished", "failed", "stopped"];
  const PREPARING_STATUSES = ["created", "queued", "pending"];
  if (TERMINAL_STATUSES.includes(status)) {
    lengthRunningArc = 0;
  }
  if (PREPARING_STATUSES.includes(status)) {
    lengthFinishedArc = 0;
    lengthRunningArc = 0;
    lengthFailedArc = 0;
  }

  // The workflow could be completely restored from the cache, in which case
  // the total number of steps would be 0. If the workflow is finished, we
  // want to show the full progress bar as finished even in this case.
  if (status === "finished") {
    lengthFinishedArc = circumference;
    lengthRunningArc = 0;
    lengthFailedArc = 0;
  }

  return (
    <div className={styles["progress-bar-container"]}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${size} ${size}`}
        width={`${size}`}
        height={`${size}`}
      >
        <circle
          cx={`${size / 2}`}
          cy={`${size / 2}`}
          r={`${radius}`}
          className={styles["progress-bar-background"]}
          strokeWidth={`${strokeWidth}`}
        />
        <circle
          cx={`${size / 2}`}
          cy={`${size / 2}`}
          r={`${radius}`}
          className={`${styles["progress-bar-running"]} ${
            styles["progress-bar-workflow-status-" + status]
          }`}
          strokeDasharray={`${lengthRunningArc} ${circumference}`}
          strokeDashoffset={`-${lengthFinishedArc}`}
          strokeWidth={`${strokeWidth}`}
        />
        <circle
          cx={`${size / 2}`}
          cy={`${size / 2}`}
          r={`${radius}`}
          className={`${styles["progress-bar-finished"]} ${
            styles["progress-bar-workflow-status-" + status]
          }`}
          strokeDasharray={`${lengthFinishedArc} ${circumference}`}
          strokeDashoffset="0"
          strokeWidth={`${strokeWidth}`}
        />
        <circle
          cx={`${size / 2}`}
          cy={`${size / 2}`}
          r={`${radius}`}
          className={`${styles["progress-bar-failed"]} ${
            styles["progress-bar-workflow-status-" + status]
          }`}
          strokeDasharray={`${lengthFailedArc} ${circumference}`}
          strokeDashoffset={`-${lengthFinishedArc}`}
          strokeWidth={`${strokeWidth}`}
        />
      </svg>
    </div>
  );
}

WorkflowProgressCircleBar.propTypes = {
  workflow: PropTypes.object.isRequired,
  size: PropTypes.number,
};
