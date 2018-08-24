/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

	REANA is free software; you can redistribute it and/or modify it under the
	terms of the GNU General Public License as published by the Free Software
	Foundation; either version 2 of the License, or (at your option) any later
	version.

	REANA is distributed in the hope that it will be useful, but WITHOUT ANY
	WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
	A PARTICULAR PURPOSE. See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with REANA; if not, see <http://www.gnu.org/licenses>.

	In applying this license, CERN does not waive the privileges and immunities
	granted to it by virtue of its status as an Intergovernmental Organization or
	submit itself to any jurisdiction.
*/

import React, { Component } from "react";
import axios from "axios";
import { Grid, Loader } from "semantic-ui-react";
import WorkflowFiles from "./WorkflowFiles";
import WorkflowSteps from "./WorkflowSteps";
import WorkflowLogs from "./workflowLogs";
import Config from "../../../config";
import State from "../../../state";

export default class WorkflowSpace extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.url = Config.api + "/api/workflows/" + State.details.id + "/";
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
      url: this.url + "workspace",
      params: {
        access_token: State.login.user_token
      }
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
    this.getWorkspace();
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
