/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Icon, Popup } from "semantic-ui-react";

import { statusMapping, ParsedWorkflow } from "~/util";
import styles from "./WorkflowInfo.module.scss";
import { WorkflowProgressCircleBar } from "~/components";

interface Props {
  workflow: ParsedWorkflow;
  actionsOnHover?: boolean;
  className?: string;
}

export default function WorkflowInfo({ workflow }: Props) {
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
    <div className={styles["workflow-info"]}>
      <div className={styles["details-box"]}>
        <Icon
          className={styles["status-icon"]}
          name={statusMapping[status].icon as any}
          color={statusMapping[status].color as any}
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
        <span
          className={`${styles["status"]} sui-${statusMapping[status].color}`}
        >
          {status}
        </span>
        <div className={styles["progress-box"]}>
          <span>
            step {completed}/{total}
          </span>
          <WorkflowProgressCircleBar workflow={workflow} />
        </div>
      </div>
    </div>
  );
}
