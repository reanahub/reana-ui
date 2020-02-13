/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Container,
  Dimmer,
  Grid,
  Loader,
  Message,
  Divider
} from "semantic-ui-react";

import config from "../../config";
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

  const [files, setFiles] = useState([]);

  useEffect(() => {
    dispatch(fetchWorkflow(workflowId));
  }, [dispatch, workflowId]);

  useEffect(() => {
    function parseData(data) {
      if (!Array.isArray(data)) return [];

      data.forEach(file => {
        file["mod_date"] = file["last-modified"].substr(0, 19);
        file["mod_date"] = file["mod_date"].replace("T", " ");
        delete file["last-modified"];
      });

      return data;
    }

    function getWorkspace() {
      axios({
        method: "get",
        url: config.api + "/api/workflows/" + workflowId + "/workspace",
        withCredentials: true
      }).then(res => {
        setFiles(parseData(res.data));
      });
    }

    getWorkspace();
  }, [workflowId]);

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
    return (
      <Grid columns={3} padded>
        <Grid.Row className={styles.content}>
          <Grid.Column width={3}>
            <WorkflowFiles files={files} title="Inputs" id={workflowId} />
          </Grid.Column>
          <Grid.Column width={10}>
            <Grid.Row>
              <WorkflowInfo workflow={workflow} />
            </Grid.Row>
            <Grid.Row>
              <Divider></Divider>
              <WorkflowLogs id={workflow.id} />
            </Grid.Row>
          </Grid.Column>
          <Grid.Column width={3}>
            <WorkflowFiles files={files} title="Outputs" id={workflowId} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
