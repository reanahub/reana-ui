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

import styles from "./WorkflowsList.module.scss";

export default function WorkflowsList() {
  const [workflows, setWorkflows] = useState(null);
  const [loading, setLoading] = useState(false);
  const interval = useRef(null);

  useEffect(() => {
    /**
     * Gets data from the specified API
     */
    function getWorkflows() {
      setLoading(true);
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
    function parseData(wfs) {
      if (!Array.isArray(wfs)) return [];

      wfs.forEach(wf => {
        const info = wf.name.split(".");
        wf.name = info.shift();
        wf.run = info.join(".");
        wf = parseDates(wf);
      });

      return wfs;
    }

    getWorkflows();
  }, []);

  useEffect(() => {
    function updateProgresses() {
      workflows.forEach(wf => {
        axios({
          method: "get",
          url: config.api + "/api/workflows/" + wf.id + "/status",
          withCredentials: true
        }).then(res => {
          const progress = res.data.progress.finished;
          const total = res.data.progress.total;
          wf.completed = typeof progress === "object" ? progress.total : 0;
          wf.total = total.total;

          wf.status = res.data.status;
          wf.run_started_at = res.data.progress.run_started_at;
          wf.run_finished_at = res.data.progress.run_finished_at;
          wf = parseDates(wf);
        });
      });
      setWorkflows([...workflows]);
    }

    if (!interval.current && workflows && workflows.length) {
      interval.current = setInterval(() => {
        updateProgresses();
      }, config.pooling_secs * 1000);
    }
  }, [workflows]);

  function parseDates(wf) {
    const createdMoment = moment.utc(wf.created);
    const startedMoment = moment.utc(wf.run_started_at);
    const finishedMoment = moment.utc(wf.run_finished_at);
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
    finished: { icon: "check circle", color: "green" },
    running: { icon: "spinner", color: "blue" },
    failed: { icon: "delete", color: "red" },
    created: { icon: "file outline", color: "violet" },
    stopped: { icon: "pause circle outline", color: "yellow" },
    queued: { icon: "hourglass outline", color: "teal" },
    deleted: { icon: "eraser", color: "gray" }
  };

  if (loading) {
    return (
      <Dimmer active>
        <Loader>Loading workflows</Loader>
      </Dimmer>
    );
  } else if (workflows && !workflows.length) {
    return <NoWorkflows />;
  } else {
    return (
      <Container text className={styles["container"]}>
        {workflows &&
          workflows.length &&
          workflows.map(
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
                  {duration}
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
