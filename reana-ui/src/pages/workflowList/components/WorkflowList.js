/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { Dimmer, Icon, Loader, Container, Popup } from "semantic-ui-react";

import NoWorkflows from "./NoWorkflows";
import config from "../../../config";

import styles from "./WorkflowList.module.scss";
import Title from "../../../components/Title";

export default function WorkflowList() {
  const currentUTCTime = () => moment.utc().format("HH:mm:ss [UTC]");
  const [workflows, setWorkflows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(currentUTCTime());
  const interval = useRef(null);

  useEffect(() => {
    /**
     * Gets data from the specified API
     */
    function getWorkflows() {
      setLoading(!interval.current);
      axios({
        method: "get",
        url: config.api + "/api/workflows",
        withCredentials: true
      }).then(res => {
        setWorkflows(parseData(res.data));
        setLoading(false);
      });
    }

    /**
     * Parses API data into displayable data
     */
    function parseData(workflows) {
      if (!Array.isArray(workflows)) return [];
      workflows.sort((a, b) => (a.created < b.created ? 1 : -1));

      workflows.forEach(wf => {
        const info = wf.name.split(".");
        wf.name = info.shift();
        wf.run = info.join(".");
        const progress = wf.progress.finished;
        const total = wf.progress.total;
        wf.completed = typeof progress === "object" ? progress.total : 0;
        wf.total = total.total;
        wf = parseDates(wf);
      });

      return workflows;
    }
    getWorkflows();

    if (!interval.current) {
      interval.current = setInterval(() => {
        getWorkflows();
        setRefreshedAt(currentUTCTime());
      }, config.poolingSecs * 1000);
    }

    return function cleanup() {
      clearInterval(interval.current);
    };
  }, []);

  function parseDates(wf) {
    const createdMoment = moment.utc(wf.created);
    const startedMoment = moment.utc(wf.progress.run_started_at);
    const finishedMoment = moment.utc(wf.progress.run_finished_at);
    wf.createdDate = createdMoment.format("Do MMM YYYY HH:mm");
    wf.startedDate = startedMoment.format("Do MMM YYYY HH:mm");
    wf.finishedDate = finishedMoment.format("Do MMM YYYY HH:mm");
    wf.friendlyCreated = moment
      .duration(-moment().diff(createdMoment))
      .humanize(true);
    let duration;
    if (startedMoment.isValid()) {
      wf.friendlyStarted = moment
        .duration(-moment().diff(startedMoment))
        .humanize(true);
      if (finishedMoment.isValid()) {
        duration = finishedMoment.diff(startedMoment);
        wf.friendlyFinished = moment
          .duration(-moment().diff(finishedMoment))
          .humanize(true);
      } else if (startedMoment.isValid()) {
        duration = moment().diff(startedMoment);
      }

      const durationMoment = moment.duration(duration);
      let format;
      if (durationMoment.hours()) {
        format = "H[h] m[m] s[s]";
      } else if (durationMoment.minutes()) {
        format = "m [min] s [sec]";
      } else {
        format = "s [seconds]";
      }
      wf.duration = moment.utc(duration).format(format);
    }
    return wf;
  }

  const statusMapping = {
    finished: { icon: "check circle", color: "green", preposition: "in" },
    running: { icon: "spinner", color: "blue", preposition: "for" },
    failed: { icon: "delete", color: "red", preposition: "after" },
    created: { icon: "file outline", color: "violet" },
    stopped: {
      icon: "pause circle outline",
      color: "yellow",
      preposition: "after"
    },
    queued: { icon: "hourglass outline", color: "teal", preposition: "for" },
    deleted: { icon: "eraser", color: "gray", preposition: "after" }
  };

  if (!workflows) {
    return null;
  }

  if (loading) {
    return (
      <Dimmer active>
        <Loader>Loading workflows</Loader>
      </Dimmer>
    );
  } else if (!workflows.length) {
    return <NoWorkflows />;
  } else {
    return (
      <Container text className={styles["container"]}>
        <Title className={styles.title}>
          <span>Your workflows</span>
          <span className={styles.refresh}>Refreshed at {refreshedAt}</span>
        </Title>

        {workflows.map(
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
            status
          }) => (
            <div
              key={id}
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
                  className={`${styles["status"]} ${
                    styles[statusMapping[status].color]
                  }`}
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
        )}
      </Container>
    );
  }
}
