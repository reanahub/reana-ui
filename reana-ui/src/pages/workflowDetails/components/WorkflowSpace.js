/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import axios from "axios";
import history from "../../../history";
import { Grid, Loader } from "semantic-ui-react";
import WorkflowFiles from "./WorkflowFiles";
import WorkflowSteps from "./WorkflowSteps";
import WorkflowLogs from "./workflowLogs";
import Config from "../../../config";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default class WorkflowSpace extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.url = Config.api + "/api/workflows/" + cookies.get("workflow-id");
    this.state = {
      inputs: [],
      outputs: [],
      renderFlag: false
    };
  }

  /**
   * Parses API data into displayable data
   */
  static parseData(data) {
    if (!Array.isArray(data)) return [];

    data.forEach(file => {
      file["mod_date"] = file["last-modified"].substr(0, 19);
      file["mod_date"] = file["mod_date"].replace("T", " ");
      delete file["last-modified"];
    });

    return data;
  }

  /**
   * Gets data from the specified API
   */
  getWorkspace() {
    axios({
      method: "get",
      url: this.url + "/workspace",
      withCredentials: true
    }).then(res => {
      let data = WorkflowSpace.parseData(res.data);
      this.setState({
        inputs: data,
        outputs: data,
        renderFlag: true
      });
    });
  }

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    if (cookies.get("user_token") === undefined) {
      history.replace("/");
    } else {
      this.getWorkspace();
    }
  }

  render() {
    const { inputs, outputs, renderFlag } = this.state;

    // Avoid rendering if files have not being fetched yet
    if (!renderFlag) {
      return <Loader active inline="centered" size="large" />;
    }

    return (
      <Grid columns="equal" padded className="controls">
        <Grid.Row stretched>
          <Grid.Column>
            <WorkflowFiles files={inputs} title="Inputs" />
          </Grid.Column>

          <Grid.Column width={10}>
            <WorkflowSteps />
            <WorkflowLogs />
          </Grid.Column>

          <Grid.Column>
            <WorkflowFiles files={outputs} title="Outputs" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
