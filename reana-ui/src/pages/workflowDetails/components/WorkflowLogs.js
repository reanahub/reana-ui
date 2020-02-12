/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Icon } from "semantic-ui-react";

import { fetchWorkflowLogs } from "../../../actions";
import { statusMapping } from "../../../util";
import { getWorkflowLogs, loadingDetails } from "../../../selectors";
import CodeSnippet from "../../../components/CodeSnippet";

import styles from "./WorkflowLogs.module.scss";

export default function WorkflowLogs({ id }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const logs = useSelector(getWorkflowLogs(id));

  useEffect(() => {
    dispatch(fetchWorkflowLogs(id));
  }, [dispatch, id]);

  const panes =
    logs &&
    Object.entries(logs).map(([_, log]) => ({
      menuItem: log.job_name,
      render: () => (
        <Tab.Pane>
          <div className={`sui-${statusMapping[log.status].color}`}>
            {log.status}
          </div>
          <div>
            <Icon name="cloud" />
            {log.compute_backend}
          </div>
          <div>
            <Icon name="docker" />
            {log.docker_img}
          </div>
          <CodeSnippet dollarPrefix={false} classes={styles.logs}>
            {log.logs}
          </CodeSnippet>
        </Tab.Pane>
      )
    }));

  return loading ? (
    "Loading..." //XXX: Improve
  ) : (
    <Tab panes={panes} />
  );
}

WorkflowLogs.propTypes = {
  id: PropTypes.string.isRequired
};
