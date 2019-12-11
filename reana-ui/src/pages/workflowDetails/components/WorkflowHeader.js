/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import { Button, Segment } from "semantic-ui-react";
import { Link } from "react-router-dom";
import Cookies from "universal-cookie";

import styles from "./WorkflowHeader.module.scss";

const cookies = new Cookies();

export default class WorkflowHeader extends Component {
  render() {
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
            {cookies.get("workflow-name")}
          </Segment>
          <Segment>
            <b>Run: </b>
            {cookies.get("workflow-run")}
          </Segment>
          <Segment>
            <b>Created: </b>
            {cookies.get("workflow-created")}
          </Segment>
          <Segment>
            <b>Status: </b>
            {cookies.get("workflow-status")}
          </Segment>
        </Segment.Group>
      </Segment>
    );
  }
}
