/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { Container, Dimmer, Loader, Message, Tab } from "semantic-ui-react";

import { fetchWorkflow } from "../../actions";
import { getWorkflow, loadingWorkflows } from "../../selectors";
import BasePage from "../BasePage";
import { WorkflowInfo, WorkflowLogs, WorkflowFiles } from "./components";

import styles from "./WorkflowDetails.module.scss";

export default function WorkflowDetailsPage() {
  return (
    <BasePage>
      <WorkflowDetails />
    </BasePage>
  );
}

function WorkflowDetails() {
  const { id: workflowId } = useParams();

  const dispatch = useDispatch();
  const workflow = useSelector(getWorkflow(workflowId));
  const loading = useSelector(loadingWorkflows);

  useEffect(() => {
    dispatch(fetchWorkflow(workflowId));
  }, [dispatch, workflowId]);

  if (loading || !workflow) {
    return (
      <Dimmer active>
        <Loader>Loading workflow...</Loader>
      </Dimmer>
    );
  }

  if (_.isEmpty(workflow)) {
    return (
      <Container text className={styles.warning}>
        <Message
          icon="warning sign"
          header="Workflow does not exist."
          size="small"
          warning
        />
      </Container>
    );
  } else {
    const panes = [
      {
        menuItem: { key: "logs", icon: "terminal", content: "Logs" },
        render: () => <WorkflowLogs id={workflow.id} />
      },
      {
        menuItem: { key: "files", icon: "folder outline", content: "Files" },
        render: () => <WorkflowFiles title="Workspace" id={workflow.id} />
      }
    ];

    return (
      <Container>
        <WorkflowInfo workflow={workflow} />
        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
      </Container>
    );
  }
}
