/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2022, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import findKey from "lodash/findKey";
import { useDispatch, useSelector } from "react-redux";
import { Icon, Dropdown, Label, Loader, Message } from "semantic-ui-react";

import { fetchWorkflowLogs } from "~/actions";
import { NON_FINISHED_STATUSES } from "~/config";
import { statusMapping } from "~/util";
import { getWorkflowLogs, loadingDetails } from "~/selectors";
import { CodeSnippet, TooltipIfTruncated } from "~/components";

import styles from "./WorkflowLogs.module.scss";

function EngineLogs({ logs, workflowStatus }) {
  const isExecuting = NON_FINISHED_STATUSES.includes(workflowStatus);
  return logs ? (
    <CodeSnippet dollarPrefix={false} classes={styles.logs}>
      {logs}
    </CodeSnippet>
  ) : (
    <Message
      icon="info circle"
      content={
        isExecuting
          ? "The workflow engine logs will be available after the workflow run finishes."
          : "There are no workflow engine logs for this execution run."
      }
      info
    />
  );
}

EngineLogs.propTypes = {
  logs: PropTypes.string.isRequired,
  workflowStatus: PropTypes.string.isRequired,
};

// The ui currently handles only Dask service logs, but this component can be extended to handle other services in the future.
// UI design should be changed to allow for multiple services to be displayed at once if another service is introduced.
function ServiceLogs({ isDask, components, workflowStatus }) {
  const isExecuting = NON_FINISHED_STATUSES.includes(workflowStatus);
  const [selectedComponentIndex, setSelectedComponentIndex] = useState("0");

  if (!isDask) {
    return (
      <Message
        icon="info circle"
        content={
          "The service logs are only available for Dask workflows at the moment."
        }
        info
      />
    );
  }

  if (isExecuting) {
    return (
      <Message
        icon="info circle"
        content={
          "The service logs will be available after the workflow run finishes."
        }
        info
      />
    );
  }

  const dropdownOptions = Object.entries(components).map(([id, component]) => ({
    key: id,
    text: component.component,
    icon: {
      name: "dot circle outline",
      size: "small",
      color: "green",
    },
    value: id,
  }));

  return (
    <>
      <section className={styles["step-info"]}>
        <div className={styles["step-dropdown"]}>
          <Label size="large" className={styles["step-label"]}>
            Component
          </Label>
          <Dropdown
            placeholder="Select a component"
            search
            selection
            options={dropdownOptions}
            value={selectedComponentIndex}
            onChange={(_, { value }) => setSelectedComponentIndex(value)}
            className={styles.dropdown}
          />
        </div>
      </section>
      {selectedComponentIndex && (
        <CodeSnippet dollarPrefix={false} classes={styles.logs}>
          {components[selectedComponentIndex].content}
        </CodeSnippet>
      )}
    </>
  );
}

ServiceLogs.propTypes = {
  components: PropTypes.array.isRequired,
  workflowStatus: PropTypes.string.isRequired,
};

function JobLogs({ logs }) {
  function chooseLastStepID(logs) {
    const failedStepId = findKey(logs, (log) => log.status === "failed");
    if (failedStepId) return failedStepId;

    const runningStepId = findKey(logs, (log) => log.status === "running");
    if (runningStepId) return runningStepId;

    // Return the last step id if there are no failed or running steps.
    return Object.keys(logs).pop();
  }

  const lastStepID = chooseLastStepID(logs);
  const [selectedStep, setSelectedStep] = useState(lastStepID);

  useEffect(() => {
    // Only update the shown step logs if there was no log displayed before
    // and there is one ready to be displayed now
    if (lastStepID && !selectedStep) {
      setSelectedStep(lastStepID);
    }
  }, [logs, lastStepID, selectedStep]);

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
  return (
    <>
      <section className={styles["step-info"]}>
        <div className={styles["step-dropdown"]}>
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
            <Label color={statusMapping[log.status].color}>
              {log.status}
              {log.duration && (
                <span className={styles["step-duration"]}>
                  {" "}
                  {statusMapping[log.status].preposition} {log.duration}
                </span>
              )}
            </Label>
            <Label>
              <Icon name="cloud" />
              {log.compute_backend}
            </Label>
            <TooltipIfTruncated tooltip={log.docker_img}>
              <Label className={styles.long}>
                <Icon name="docker" />
                {log.docker_img}
              </Label>
            </TooltipIfTruncated>
            <TooltipIfTruncated tooltip={log.cmd}>
              <Label className={styles.long}>
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

JobLogs.propTypes = {
  logs: PropTypes.object.isRequired,
};

export default function WorkflowLogs({
  workflow,
  engine = false,
  service = false,
}) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const {
    engineLogs = "",
    jobLogs = {},
    serviceLogs = {},
  } = useSelector(getWorkflowLogs(workflow.id));

  useEffect(() => {
    dispatch(fetchWorkflowLogs(workflow.id));
  }, [dispatch, workflow]);

  return loading ? (
    <Loader active inline="centered" />
  ) : engine ? (
    <EngineLogs workflowStatus={workflow.status} logs={engineLogs} />
  ) : service ? (
    <ServiceLogs
      isDask={workflow.services.length > 0}
      workflowStatus={workflow.status}
      components={
        Object.keys(serviceLogs).length === 0
          ? []
          : Object.values(serviceLogs)[0]
      }
    />
  ) : (
    <JobLogs logs={jobLogs} />
  );
}

WorkflowLogs.propTypes = {
  workflow: PropTypes.object.isRequired,
  engine: PropTypes.bool,
  service: PropTypes.bool,
};
