/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { Icon, Popup, Loader } from "semantic-ui-react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import { getReanaToken } from "~/selectors";
import {
  JupyterNotebookIcon,
  WorkflowActionsPopup,
  WorkflowDeleteModal,
} from "~/components";
import { statusMapping, formatInteractiveSessionUri } from "~/util";

import styles from "./WorkflowList.module.scss";

export default function WorkflowList({ workflows, loading }) {
  const history = useHistory();
  const reanaToken = useSelector(getReanaToken);

  if (loading) return <Loader active />;
  return (
    <>
      {workflows.map((workflow) => {
        const {
          id,
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
          size,
          status,
          session_uri: sessionUri,
          session_status: sessionStatus,
        } = workflow;
        const isDeleted = status === "deleted";
        const hasDiskUsage = size.raw > 0;
        const isDeletedUsingWorkspace = isDeleted && hasDiskUsage;
        const isSessionOpen = sessionStatus === "created";
        return (
          <div
            key={id}
            onClick={() => history.push(`/details/${id}`)}
            className={`${styles["workflow"]} ${
              isDeleted ? styles["deleted"] : ""
            }`}
          >
            <div className={styles["details-box"]}>
              <Icon
                name={statusMapping[status].icon}
                color={statusMapping[status].color}
              />{" "}
              <span className={styles.name}>{name}</span>
              <span className={styles.run}>#{run}</span>
              <span
                className={`${styles.size} ${
                  isDeletedUsingWorkspace ? styles.highlight : ""
                }`}
              >
                {hasDiskUsage && (
                  <>
                    <Icon name="hdd" /> {size.human_readable}
                  </>
                )}
              </span>
              {isSessionOpen && (
                <a
                  href={formatInteractiveSessionUri(sessionUri, reanaToken)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={styles.notebook}
                >
                  <JupyterNotebookIcon />
                </a>
              )}
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
            <div className={styles["status-box"]}>
              <span
                className={`${styles["status"]} sui-${statusMapping[status].color}`}
              >
                {status}
              </span>{" "}
              {statusMapping[status].preposition} {!isDeleted && duration}
              <div>
                step {completed}/{total}
              </div>
            </div>
            <WorkflowActionsPopup
              workflow={workflow}
              className={styles.actions}
            />
          </div>
        );
      })}

      <WorkflowDeleteModal />
    </>
  );
}

WorkflowList.propTypes = {
  workflows: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
};
