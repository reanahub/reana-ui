/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import PropTypes from "prop-types";
import { Icon, Popup } from "semantic-ui-react";

import { statusMapping } from "~/util";
import { WorkflowProgress } from "../components";

import styles from "./WorkflowInfo.module.scss";

const NON_FINISHED_STATUSES = ["created", "queued", "running"];

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
  } = workflow;
  return (
    <div className={styles.workflow}>
      <section className={styles.info}>
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
        <div>
          <span
            className={`${styles["status"]} sui-${statusMapping[status].color}`}
          >
            {status}
          </span>{" "}
          {statusMapping[status].preposition} {status !== "deleted" && duration}
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
      </section>
      <WorkflowProgress workflow={workflow} />
    </div>
  );
}

WorkflowInfo.propTypes = {
  workflow: PropTypes.object.isRequired,
};
