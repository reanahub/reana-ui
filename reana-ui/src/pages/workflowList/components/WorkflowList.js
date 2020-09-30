/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Icon, Popup, Loader } from "semantic-ui-react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import { statusMapping } from "../../../util";

import styles from "./WorkflowList.module.scss";

export default function WorkflowList({ workflows, loading }) {
  const history = useHistory();

  if (loading) return <Loader active />;
  return workflows.map(
    ({
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
      status,
    }) => (
      <div
        key={id}
        onClick={() => history.push(`/details/${id}`)}
        className={`${styles["workflow"]} ${
          status === "deleted" ? styles["deleted"] : ""
        }`}
      >
        <div>
          <Icon
            name={statusMapping[status].icon}
            color={statusMapping[status].color}
          />{" "}
          <span className={styles["name"]}>{name}</span>
          <span className={styles["run"]}>#{run}</span>
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
          {statusMapping[status].preposition} {duration}
          <div>
            step {completed}/{total}
          </div>
        </div>
      </div>
    )
  );
}

WorkflowList.propTypes = {
  workflows: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
};
