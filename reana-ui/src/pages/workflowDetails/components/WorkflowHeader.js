/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { useSelector } from "react-redux";
import { Button, Segment } from "semantic-ui-react";
import { Link, useParams } from "react-router-dom";

import { getWorkflow } from "../../../selectors";

import styles from "./WorkflowHeader.module.scss";

export default function WorkflowHeader() {
  const { id: workflowId } = useParams();

  const workflow = useSelector(getWorkflow(workflowId));

  return (
    <Segment
      basic
      clearing
      className={styles["workflow-header"]}
      style={{ margin: "0px" }}
    >
      <Segment basic floated="left" style={{ margin: "0px" }}>
        <Link to="/workflows">
          <Button primary icon="angle left" size="big" />
        </Link>
      </Segment>

      <Segment.Group horizontal size="medium" floated="right">
        <Segment>
          <b>Name: </b>
          {workflow.name}
        </Segment>
        <Segment>
          <b>Run: </b>
          {workflow.run}
        </Segment>
        <Segment>
          <b>Created: </b>
          {workflow.created}
        </Segment>
        <Segment>
          <b>Status: </b>
          {workflow.status}
        </Segment>
      </Segment.Group>
    </Segment>
  );
}
