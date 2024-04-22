/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import styles from "./WorkflowProgressCircleBar.module.scss";

export default function WorkflowProgressCircleBar({
  workflow,
  strokeWidth = 22,
  size = "1em",
}) {
  const { completed, failed, running: started, total, status } = workflow;

  // running also includes the completed and failed steps
  const running = started - completed - failed;

  const viewBoxSize = 100;
  const radius = (viewBoxSize - strokeWidth) / 2;

  // length of the arcs, as fractions of the total number of steps
  let lengthFinishedArc = total ? (completed ?? 0) / total : 0;
  let lengthFailedArc = total ? (failed ?? 0) / total : 0;
  let lengthRunningArc = total ? (running ?? 0) / total : 0;

  // The workflow could be completely restored from the cache, in which case
  // the total number of steps would be 0. If the workflow is finished, we
  // want to show the full progress bar as finished even in this case.
  if (status === "finished") {
    lengthFinishedArc = 1;
    lengthFailedArc = 0;
    lengthRunningArc = 0;
  }

  const calculateArcPath = (length, offset) => {
    if (length >= 1) {
      // cannot use 1 as otherwise the full circle would not be drawn
      length = 0.9999;
    }

    // start end end angles of the arc, in radians
    // an arc with zero offset starts from the top (pi/2 radians)
    const start_rad = Math.PI / 2 - offset * Math.PI * 2;
    const end_rad = Math.PI / 2 - (offset + length) * Math.PI * 2;

    // y coordinates are subtracted and not added because the y axis points downwards
    const start_x = viewBoxSize / 2 + radius * Math.cos(start_rad);
    const start_y = viewBoxSize / 2 - radius * Math.sin(start_rad);
    const end_x = viewBoxSize / 2 + radius * Math.cos(end_rad);
    const end_y = viewBoxSize / 2 - radius * Math.sin(end_rad);

    // move to the center and draw the arc
    return `M ${start_x} ${start_y}
    A ${radius} ${radius} 0 ${length > 0.5 ? 1 : 0} 1 ${end_x} ${end_y} `;
  };

  return (
    <span
      style={{ width: size, height: size }}
      className={styles["progress-bar-container"]}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <circle
          cx={`${viewBoxSize / 2}`}
          cy={`${viewBoxSize / 2}`}
          r={`${radius}`}
          className={styles["progress-bar-background"]}
          strokeWidth={strokeWidth}
          pathLength={100}
        />
        <path
          d={calculateArcPath(lengthFinishedArc, 0)}
          className={`${styles["progress-bar-finished"]} ${
            styles["progress-bar-workflow-status-" + status]
          }`}
          strokeWidth={strokeWidth}
        />
        <path
          d={calculateArcPath(lengthFailedArc, lengthFinishedArc)}
          className={`${styles["progress-bar-failed"]} ${
            styles["progress-bar-workflow-status-" + status]
          }`}
          strokeWidth={strokeWidth}
        />
        <path
          d={calculateArcPath(
            lengthRunningArc,
            lengthFinishedArc + lengthFailedArc,
          )}
          className={`${styles["progress-bar-running"]} ${
            styles["progress-bar-workflow-status-" + status]
          }`}
          strokeWidth={strokeWidth}
        />
      </svg>
    </span>
  );
}

WorkflowProgressCircleBar.propTypes = {
  workflow: PropTypes.object.isRequired,
  size: PropTypes.number,
};
