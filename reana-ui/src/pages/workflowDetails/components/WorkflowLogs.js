/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2022, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
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
  // start empty to avoid reading components[0] before data arrives
  const [selectedComponentIndex, setSelectedComponentIndex] = useState("");
  const { id: workflowId, job: componentFromPath } = useParams();
  const navigate = useNavigate();

  // Keep dropdown selection and URL in sync (must run before any early return to satisfy hooks rule)
  useEffect(() => {
    if (!isDask || isExecuting) return;
    if (!Array.isArray(components) || components.length === 0) {
      if (selectedComponentIndex !== "") setSelectedComponentIndex("");
      return;
    }
    if (componentFromPath) {
      const idx = components.findIndex(
        (c) => c && c.component === componentFromPath,
      );
      if (idx >= 0) {
        if (String(idx) !== selectedComponentIndex) {
          setSelectedComponentIndex(String(idx));
        }
        return;
      }
    }
    // Standardize URL to first component when missing/invalid
    navigate(
      `/workflows/${workflowId}/service-logs/${encodeURIComponent(components[0].component)}`,
      { replace: true },
    );
  }, [
    isDask,
    isExecuting,
    components,
    componentFromPath,
    workflowId,
    navigate,
    selectedComponentIndex,
  ]);

  if (!isDask) {
    return (
      <Message
        icon="info circle"
        content={"The service logs are only available for Dask workflows."}
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
            onChange={(_, { value }) => {
              setSelectedComponentIndex(value);
              const componentName = components?.[value]?.component;
              if (componentName) {
                navigate(
                  `/workflows/${workflowId}/service-logs/${encodeURIComponent(componentName)}`,
                  { replace: false },
                );
              }
            }}
            className={styles.dropdown}
          />
        </div>
      </section>
      {components?.[selectedComponentIndex]?.content ? (
        <CodeSnippet dollarPrefix={false} classes={styles.logs}>
          {components[selectedComponentIndex].content}
        </CodeSnippet>
      ) : (
        <Message
          icon="info circle"
          content="There are no service logs to display."
          info
        />
      )}
    </>
  );
}

ServiceLogs.propTypes = {
  components: PropTypes.array.isRequired,
  workflowStatus: PropTypes.string.isRequired,
};

function JobLogs({ logs }) {
  const { id: workflowId, job: jobFromPath } = useParams();
  const navigate = useNavigate();

  // Standardize selector: path /workflows/:id/job-logs/:job where :job = backend_job_id
  const urlBackendId = jobFromPath || undefined;

  // Pick a reasonable default backend job id
  const allJobs = Object.values(logs);
  const defaultBackendId =
    allJobs.find((l) => l.status === "failed")?.backend_job_id ||
    allJobs.find((l) => l.status === "running")?.backend_job_id ||
    allJobs.at(-1)?.backend_job_id;

  const [selectedJobId, setSelectedJobId] = useState(
    urlBackendId || defaultBackendId,
  );

  // If URL changes externally, reflect in state
  useEffect(() => {
    const nextId = jobFromPath || undefined;
    if (!nextId) return;
    const exists = allJobs.some((l) => l.backend_job_id === nextId);
    if (exists && nextId !== selectedJobId) {
      selectedJobId(nextId);
    }
  }, [jobFromPath, selectedJobId, allJobs]);

  // If job is invalid, navigate to a safe fallback to prevent crashing
  useEffect(() => {
    if (!allJobs.length) return; // nothing to validate yet
    const backendIds = allJobs.map((l) => l.backend_job_id).filter(Boolean);
    const invalidParam = urlBackendId && !backendIds.includes(urlBackendId);
    if (invalidParam) {
      const base = `/workflows/${workflowId}/job-logs`;
      const fallback = defaultBackendId || null;
      const target = fallback ? `${base}/${fallback}` : base;
      navigate(target, { replace: true });
    }
  }, [urlBackendId, allJobs, defaultBackendId, workflowId, navigate]);

  // Ensure selectedJobId always matches an existing job
  useEffect(() => {
    const found = Object.values(logs).find(
      (l) => l.backend_job_id === selectedJobId,
    );
    if (!found) {
      setSelectedJobId(defaultBackendId);
    }
  }, [logs, selectedJobId, defaultBackendId]);

  const steps = Object.entries(logs).map(([id, log]) => ({
    key: log.backend_job_id,
    text: log.job_name || log.backend_job_id,
    icon: {
      name: "dot circle outline",
      size: "small",
      color: statusMapping[log.status].color,
    },
    value: log.backend_job_id,
  }));

  const log = Object.values(logs).find(
    (l) => l.backend_job_id === selectedJobId,
  );

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
            value={selectedJobId}
            onChange={(_, { value }) => {
              setSelectedJobId(value);
              // Build new path with backend_job_id as a part of the URL
              const base = `/workflows/${workflowId}/job-logs`;
              const path = value ? `${base}/${value}` : base;
              navigate(path, { replace: false });
            }}
            className={styles.dropdown}
          />
        </div>
        {!log && allJobs.length > 0 && (
          <Message
            icon="info circle"
            content="Selected job was not found. Showing the default job."
            info
          />
        )}
        {log && (
          <div className={styles["step-tags"]}>
            <Label basic color={statusMapping[log.status].color}>
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
