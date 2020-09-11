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
import { Container, Dimmer, Loader, Tab } from "semantic-ui-react";

import { fetchWorkflow } from "../../actions";
import { getWorkflow, loadingWorkflows, isWorkflowsFetched } from "../../selectors";
import BasePage from "../BasePage";
import { Notification } from "../../components";
import {
  WorkflowInfo,
  WorkflowLogs,
  WorkflowFiles,
  WorkflowSpecification
} from "./components";

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
  const workflowsFetched = useSelector(isWorkflowsFetched);

  useEffect(() => {
    dispatch(fetchWorkflow(workflowId));
  }, [dispatch, workflowId]);

  if (!workflowsFetched || loading) {
    return (
      <Dimmer active inverted>
        <Loader>Loading workflow...</Loader>
      </Dimmer>
    );
  }

  if (!workflow) {
    return (
      <Notification
        message="Sorry, this workflow either does not exist or you are not authorised to see it."
        closable={false}
      />
    );
  }

  const panes = [
    {
      menuItem: { key: "logs", icon: "terminal", content: "Logs" },
      render: () => <WorkflowLogs id={workflow.id} />
    },
    {
      menuItem: {
        key: "workspace",
        icon: "folder outline",
        content: "Workspace"
      },
      render: () => <WorkflowFiles title="Workspace" id={workflow.id} />
    },
    {
      menuItem: {
        key: "specification",
        icon: "file code outline",
        content: "Specification"
      },
      render: () => <WorkflowSpecification id={workflow.id} />
    }
  ];

  return (
    <Container>
      <WorkflowInfo workflow={workflow} />
      <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
    </Container>
  );
}
