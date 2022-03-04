/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { Icon, Popup } from "semantic-ui-react";

import { INTERACTIVE_SESSION_URL } from "~/client";
import { getReanaToken } from "~/selectors";
import { statusMapping } from "~/util";
import { LauncherLabel, WorkflowProgress } from "../components";
import { JupyterNotebookIcon, WorkflowActionsPopup } from "~/components";
import styles from "./WorkflowInfo.module.scss";

const NON_FINISHED_STATUSES = ["created", "queued", "pending", "running"];

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
    duration,
    completed,
    total,
    status,
    launcherURL,
    session_uri: sessionUri,
    session_status: sessionStatus,
  } = workflow;
  const reanaToken = useSelector(getReanaToken);
  const isSessionOpen = sessionStatus === "created";
  return (
    <div className={styles.workflow}>
      <section className={styles.info}>
        <div>
          <div className={styles["first-row"]}>
            <Icon
              name={statusMapping[status].icon}
              color={statusMapping[status].color}
            />{" "}
            <span className={styles["name"]}>{name}</span>
            <span className={styles["run"]}>#{run}</span>
            {isSessionOpen && (
              <a
                href={INTERACTIVE_SESSION_URL(sessionUri, reanaToken)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={styles.notebook}
              >
                <JupyterNotebookIcon />
              </a>
            )}
            <span className={styles["launcher-label"]}>
              <LauncherLabel url={launcherURL} />
            </span>
          </div>
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
        <div className={styles.info}>
          <div>
            <div className={styles["first-row"]}>
              <span
                className={`${styles["status"]} sui-${statusMapping[status].color}`}
              >
                {status}
              </span>{" "}
              {statusMapping[status].preposition}{" "}
              {status !== "deleted" && duration}
            </div>
            {NON_FINISHED_STATUSES.includes(status) && (
              <Icon
                name="refresh"
                className={styles.refresh}
                onClick={() => window.location.reload()}
              />
            )}
            <div>
              step {completed}/{total}
            </div>
          </div>
          <WorkflowActionsPopup workflow={workflow} />
        </div>
      </section>
      <WorkflowProgress workflow={workflow} />
    </div>
  );
}

WorkflowInfo.propTypes = {
  workflow: PropTypes.object.isRequired,
};
