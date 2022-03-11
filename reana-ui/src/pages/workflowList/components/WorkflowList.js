/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { Icon, Loader, Message, Popup } from "semantic-ui-react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { INTERACTIVE_SESSION_URL } from "~/client";
import { getReanaToken } from "~/selectors";
import {
  Box,
  JupyterNotebookIcon,
  WorkflowActionsPopup,
  WorkflowDeleteModal,
} from "~/components";
import { statusMapping } from "~/util";

import styles from "./WorkflowList.module.scss";

export default function WorkflowList({ workflows, loading }) {
  const reanaToken = useSelector(getReanaToken);

  if (loading) return <Loader active />;
  if (!workflows.length) {
    return <Message info icon="info circle" content="No workflows found." />;
  }
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
          <Link key={id} to={`/details/${id}`}>
            <Box
              className={`${styles.workflow} ${
                isDeleted ? styles["deleted"] : ""
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
                  <div>
                    {hasDiskUsage && (
                      <span
                        className={`${styles.size} ${
                          isDeletedUsingWorkspace ? styles.highlight : ""
                        }`}
                      >
                        <Icon name="hdd" /> {size.human_readable}
                      </span>
                    )}
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
            </Box>
          </Link>
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
