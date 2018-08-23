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
import { Grid, Header, Icon, Segment, Table } from "semantic-ui-react";
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
      inputs: {
        col: null,
        files: [],
        dir: null
      },
      outputs: {
        col: null,
        files: [],
        dir: null
      }
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
      let data = WorkflowFiles.parseData(res.data);
      this.setState({
        inputs: { files: data },
        outputs: { files: data }
      });
    });
  }

  /**
   * Downloads the file from the API
   */
  // getFile = file_name => () => {
  //   axios({
  //     method: "get",
  //     url: this.url + "workspace/" + file_name,
  //     params: {
  //       access_token: State.login.user_token
  //     }
  //   }).then(res => {
  //     let element = document.createElement("a");
  //     element.setAttribute(
  //       "href",
  //       "data:application/octet-stream," + encodeURIComponent(res.data)
  //     );
  //     element.setAttribute("download", file_name);
  //     element.style.display = "none";
  //     document.body.appendChild(element);
  //     element.click();
  //     document.body.removeChild(element);
  //   });
  // };

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    this.getWorkspace();
  }

  /**
   * Performs the sorting when a column header is clicked
   */
  handleSortInputs = clickedColumn => () => {
    const { inputs } = this.state;
    if (inputs.col !== clickedColumn) {
      this.setState({
        inputs: {
          col: clickedColumn,
          files: _.sortBy(inputs.files, [clickedColumn]),
          dir: "ascending"
        }
      });
      return;
    }
    this.setState({
      inputs: {
        files: inputs.files.reverse(),
        dir: inputs.dir === "ascending" ? "descending" : "ascending"
      }
    });
  };

  /**
   * Performs the sorting when a column header is clicked
   */
  handleSortOutputs = clickedColumn => () => {
    const { outputs } = this.state;
    if (outputs.col !== clickedColumn) {
      this.setState({
        outputs: {
          col: clickedColumn,
          files: _.sortBy(outputs.files, [clickedColumn]),
          dir: "ascending"
        }
      });
      return;
    }
    this.setState({
      outputs: {
        files: outputs.files.reverse(),
        dir: outputs.dir === "ascending" ? "descending" : "ascending"
      }
    });
  };

  render() {
    const { inputs, outputs } = this.state;

    return (
      <Grid columns="equal" padded className="controls">
        <Grid.Row stretched>
          <Grid.Column>
            <Segment raised padded secondary>
              <Header size="medium">Inputs</Header>
              <Table fixed compact sortable basic="very">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell
                      sorted={inputs.col === "name" ? inputs.dir : null}
                      onClick={this.handleSortInputs("name")}
                    >
                      Name
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={inputs.col === "mod_date" ? inputs.dir : null}
                      onClick={this.handleSortInputs("mod_date")}
                    >
                      Modified date
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body className="files-list">
                  {_.map(inputs.files, ({ name, mod_date }) => (
                    <Table.Row key={name} className="files-row">
                      <Table.Cell>
                        <Icon name="file" />
                        {name}
                      </Table.Cell>
                      <Table.Cell>{mod_date}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Segment>
          </Grid.Column>

          <Grid.Column width={10}>
            <WorkflowSteps />
            <WorkflowLogs />
          </Grid.Column>

          <Grid.Column>
            <Segment raised padded secondary>
              <Header size="medium">Outputs</Header>
              <Table fixed compact sortable basic="very">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell
                      sorted={outputs.col === "name" ? outputs.dir : null}
                      onClick={this.handleSortOutputs("name")}
                    >
                      Name
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      sorted={outputs.col === "mod_date" ? outputs.dir : null}
                      onClick={this.handleSortOutputs("mod_date")}
                    >
                      Modified date
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {_.map(outputs.files, ({ name, mod_date }) => (
                    <Table.Row key={name} className="files-row">
                      <Table.Cell>
                        <Icon name="file" />
                        {name}
                      </Table.Cell>
                      <Table.Cell>{mod_date}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
