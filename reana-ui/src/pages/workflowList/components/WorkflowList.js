/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { Icon, Popup, Loader } from "semantic-ui-react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import { WorkflowDeleteModal, WorkflowActionsPopup } from "../components";
import { statusMapping } from "../../../util";

import styles from "./WorkflowList.module.scss";

export default function WorkflowList({ workflows, loading }) {
  const history = useHistory();
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState({});

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
        } = workflow;
        return (
          <div
            key={id}
            onClick={() => history.push(`/details/${id}`)}
            className={`${styles["workflow"]} ${
              status === "deleted" ? styles["deleted"] : ""
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
                  status === "deleted" && size !== "0K" ? styles.highlight : ""
                }`}
              >
                <Icon name="hdd" />
                {size}
              </span>
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
              {statusMapping[status].preposition}{" "}
              {status !== "deleted" && duration}
              <div>
                step {completed}/{total}
              </div>
            </div>
            <div className={styles.actions}>
              {(status !== "deleted" ||
                (status === "deleted" && size !== "0K")) && (
                <WorkflowActionsPopup
                  workflow={workflow}
                  setOpenDeleteModal={setOpenDeleteModal}
                  setSelectedWorkflow={setSelectedWorkflow}
                />
              )}
            </div>
          </div>
        );
      })}

      <WorkflowDeleteModal
        open={openDeleteModal}
        workflow={selectedWorkflow}
        setOpenDeleteModal={setOpenDeleteModal}
        setSelectedWorkflow={setSelectedWorkflow}
      />
    </>
  );
}

WorkflowList.propTypes = {
  workflows: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
};
