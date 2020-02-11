/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { Container, Dimmer, Grid, Loader, Message } from "semantic-ui-react";

import { fetchWorkflow } from "../../actions";
import { getWorkflow, loadingWorkflows } from "../../selectors";
import BasePage from "../BasePage";
import WorkflowHeader from "./components/WorkflowHeader";
import WorkflowSpace from "./components/WorkflowSpace";
import { WorkflowInfo, WorkflowLogs } from "./components";

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

  if (loading) {
    return (
      <Dimmer active>
        <Loader>Loading workflow</Loader>
      </Dimmer>
    );
  }

  if (!workflow) {
    return (
      <Container text className={styles.container}>
        <Message
          icon="warning sign"
          header="Workflow does not exist."
          size="small"
          warning
        />
      </Container>
    );
  } else {
    return (
      <Grid columns={3} padded>
        <Grid.Row>
          <Grid.Column width={3}>Inputs</Grid.Column>
          <Grid.Column width={10}>
            <Grid.Row>
              <WorkflowInfo workflow={workflow} />
            </Grid.Row>
            <Grid.Row>
              <WorkflowLogs id={workflow.id} />
            </Grid.Row>
          </Grid.Column>
          <Grid.Column width={3}>Outputs</Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
