/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Icon, Popup } from "semantic-ui-react";
import PropTypes from "prop-types";

import { statusMapping } from "~/util";

import styles from "./WorkflowInfo.module.scss";
import { WorkflowProgressCircleBar } from "~/components";

export default function WorkflowInfo({ workflow }) {
  const {
    name,
    run,
    createdDate,
    startedDate,
    finishedDate,
    friendlyCreated,
    friendlyStarted,
    friendlyFinished,
    completed,
    total,
    status,
  } = workflow;

  return (
    <div>
      <div
        className={`${styles.flexbox} ${styles.workflow} ${
          status === "deleted" ? styles.deleted : ""
        }`}
      >
        <div className={styles["details-box"]}>
          <Icon
            className={styles["status-icon"]}
            name={statusMapping[status].icon}
            color={statusMapping[status].color}
          />
          <div>
            <span className={styles.name}>{name}</span>
            <span className={styles.run}>#{run}</span>
            <Popup
              trigger={
                <div>
                  {friendlyFinished
                    ? `Finished ${friendlyFinished}`
                    : friendlyStarted
                      ? `Started ${friendlyStarted}`
                      : `Created ${friendlyCreated}`}
                </div>
              }
              content={
                friendlyFinished
                  ? finishedDate
                  : friendlyStarted
                    ? startedDate
                    : createdDate
              }
            />
          </div>
        </div>
        <div className={styles["status-box"]}>
          <div>
            <span
              className={`${styles["status"]} sui-${statusMapping[status].color}`}
            >
              {status}
            </span>{" "}
            <div>
              step {completed}/{total}
            </div>
          </div>
          <div className={styles["progressbar-container"]}>
            <WorkflowProgressCircleBar workflow={workflow} />
          </div>
        </div>
      </div>
    </div>
  );
}

WorkflowInfo.propTypes = {
  workflow: PropTypes.object.isRequired,
};
