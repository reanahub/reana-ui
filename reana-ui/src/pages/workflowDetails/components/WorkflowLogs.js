/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Icon, Dropdown, Label, Popup } from "semantic-ui-react";

import { fetchWorkflowLogs } from "../../../actions";
import { statusMapping } from "../../../util";
import { getWorkflowLogs, loadingDetails } from "../../../selectors";
import CodeSnippet from "../../../components/CodeSnippet";

import styles from "./WorkflowLogs.module.scss";

export default function WorkflowLogs({ id }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const logs = useSelector(getWorkflowLogs(id));
  const [selectedStep, setSelectedStep] = useState();

  useEffect(() => {
    dispatch(fetchWorkflowLogs(id));
  }, [dispatch, id]);

  const steps = Object.entries(logs).map(([id, log]) => ({
    key: id,
    text: log.job_name || log.backend_job_id,
    value: id
  }));

  const log = logs[selectedStep];
  return loading ? (
    "Loading..." //XXX: Improve
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
            onChange={(_, { value }) => setSelectedStep(value)}
          />
        </div>
        {log && (
          <div className={styles["step-tags"]}>
            <Label color={statusMapping[log.status].color}>{log.status}</Label>
            <Label>
              <Icon name="cloud" />
              {log.compute_backend}
            </Label>
            <Label>
              <Icon name="docker" />
              {log.docker_img}
            </Label>
            <Popup
              trigger={
                <Label className={styles.cmd}>
                  <Icon name="terminal" />
                  {log.cmd}
                </Label>
              }
              content={log.cmd}
            />
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
  id: PropTypes.string.isRequired
};
