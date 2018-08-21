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
import _ from "lodash";
import { Grid, List, Header, Segment } from "semantic-ui-react";
import WorkflowSteps from "./WorkflowSteps";
import WorkflowLogs from "./workflowLogs";
import Config from "../../../config";
import State from "../../../state";

export default class WorkflowFiles extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.url = Config.api + "/api/workflows/" + State.details.id + "/";
    this.state = {
      input_files: [],
      code_files: [],
      output_files: []
    };
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
      this.setState({
        input_files: res.data,
        code_files: res.data,
        output_files: res.data
      });
    });
  }

  /**
   * Downloads the file from the API
   */
  getFile = file_name => () => {
    axios({
      method: "get",
      url: this.url + "workspace/" + file_name,
      params: {
        access_token: State.login.user_token
      }
    }).then(res => {
      let element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:application/octet-stream," + encodeURIComponent(res.data)
      );
      element.setAttribute("download", file_name);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    });
  };

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    this.getWorkspace();
  }

  render() {
    const { input_files, code_files, output_files } = this.state;

    return (
      <Grid columns="equal" padded className="controls">
        <Grid.Row stretched>
          <Grid.Column>
            <Segment raised padded secondary>
              <Header size="medium">Inputs</Header>
              <List link>
                {_.map(input_files, ({ name }) => (
                  <List.Item onClick={this.getFile(name)} as="a" key={name}>
                    {name}
                  </List.Item>
                ))}
              </List>
            </Segment>
            <Segment raised padded secondary>
              <Header size="medium">Code</Header>
              <List link>
                {_.map(code_files, ({ name }) => (
                  <List.Item onClick={this.getFile(name)} as="a" key={name}>
                    {name}
                  </List.Item>
                ))}
              </List>
            </Segment>
          </Grid.Column>

          <Grid.Column width={10}>
            <WorkflowSteps />
            <WorkflowLogs />
          </Grid.Column>

          <Grid.Column>
            <Segment raised padded secondary>
              <Header size="medium">Outputs</Header>
              <List link>
                {_.map(output_files, ({ name }) => (
                  <List.Item onClick={this.getFile(name)} as="a" key={name}>
                    {name}
                  </List.Item>
                ))}
              </List>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
