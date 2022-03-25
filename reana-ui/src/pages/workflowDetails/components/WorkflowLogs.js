/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import findKey from "lodash/findKey";
import { useDispatch, useSelector } from "react-redux";
import { Icon, Dropdown, Label, Loader } from "semantic-ui-react";

import { fetchWorkflowLogs } from "~/actions";
import { statusMapping } from "~/util";
import { getWorkflowLogs, loadingDetails } from "~/selectors";
import { CodeSnippet, TooltipIfTruncated } from "~/components";

import styles from "./WorkflowLogs.module.scss";

export default function WorkflowLogs({ id }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const logs = useSelector(getWorkflowLogs(id));
  const [selectedStep, setSelectedStep] = useState();

  useEffect(() => {
    dispatch(fetchWorkflowLogs(id));
  }, [dispatch, id]);

  useEffect(() => {
    const failedStepId = findKey(logs, (log) => log.status === "failed");
    if (failedStepId) return setSelectedStep(failedStepId);

    const runningStepId = findKey(logs, (log) => log.status === "running");
    if (runningStepId) return setSelectedStep(runningStepId);

    const logKeys = Object.keys(logs);
    setSelectedStep(logKeys[logKeys.length - 1]);
  }, [logs]);

  const steps = Object.entries(logs).map(([id, log]) => ({
    key: id,
    text: log.job_name || log.backend_job_id,
    icon: {
      name: "dot circle outline",
      size: "small",
      color: statusMapping[log.status].color,
    },
    value: id,
  }));

  const log = logs[selectedStep];
  return loading ? (
    <Loader active inline="centered" />
  ) : (
    <>
      <section className={styles["step-info"]}>
        <div>
          <Label size="large" className={styles["step-label"]}>
            Step
          </Label>
          <Dropdown
            placeholder="Select a workflow step"
            search
            selection
            options={steps}
            value={selectedStep}
            onChange={(_, { value }) => setSelectedStep(value)}
            className={styles.dropdown}
          />
        </div>
        {log && (
          <div className={styles["step-tags"]}>
            <Label color={statusMapping[log.status].color}>{log.status}</Label>
            <Label>
              <Icon name="cloud" />
              {log.compute_backend}
            </Label>
            <TooltipIfTruncated tooltip={log.docker_img}>
              <Label className={styles.label}>
                <Icon name="docker" />
                {log.docker_img}
              </Label>
            </TooltipIfTruncated>
            <TooltipIfTruncated tooltip={log.cmd}>
              <Label className={styles.label}>
                <Icon name="dollar" />
                {log.cmd}
              </Label>
            </TooltipIfTruncated>
          </div>
        )}
      </section>
      {log && (
        <CodeSnippet dollarPrefix={false} classes={styles.logs}>
          {log.logs}
        </CodeSnippet>
      )}
    </>
  );
}

WorkflowLogs.propTypes = {
  id: PropTypes.string.isRequired,
};
