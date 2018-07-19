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
import { Icon, Menu, Segment, Table } from "semantic-ui-react";
import WorkflowProgress from "./WorkflowProgress";
import WorkflowActions from "./WorkflowActions";
import _ from "lodash";

const URL = "http://reana-dev.cern.ch/api/workflows?";
const TOKEN = "<ACCESS_TOKEN>";
const POOLING_PERIOD = 5;

export default class WorkflowList extends Component {
  /**
   * Variables defining the state of the table
   */
  state = {
    column: null,
    data: [],
    direction: null,
    interval: null
  };

  /**
   * Transforms millisecond into a 'HH MM SS' string format
   */
  static msToTime(millis) {
    let seconds = Math.floor((millis / 1000) % 60);
    let minutes = Math.floor((millis / (1000 * 60)) % 60);
    let hours = Math.floor((millis / (1000 * 60 * 60)) % 24);
    let days = Math.floor(millis / (1000 * 60 * 60 * 24));

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
  }

  /**
   * Parses API data into displayable data
   */
  static parseData(data) {
    if (!Array.isArray(data)) return [];

    data.forEach(workflow => {
      let info = workflow["name"].split(".");
      workflow["name"] = info[0];
      workflow["run"] = info[1];

      let date = new Date(workflow["created"]);
      workflow["created"] =
        date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
      workflow["duration"] = WorkflowList.msToTime(Date.now() - date.getTime());
    });

    return data;
  }

  /**
   * Gets data from the specified API
   */
  getData() {
    fetch(URL + "access_token=" + TOKEN)
      .then(response => response.json())
      .then(data => {
        const { column, direction } = this.state;

        data = _.sortBy(WorkflowList.parseData(data), [column]);
        this.setState({
          data: direction === "descending" ? data.reverse() : data
        });
      });
  }

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    this.getData();
    this.setState({
      interval: setInterval(() => {
        this.getData();
      }, POOLING_PERIOD * 1000)
    });
  }

  /**
   * Performs the sorting when a column header is clicked
   */
  handleSort = clickedColumn => () => {
    const { column, data, direction } = this.state;

    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        data: _.sortBy(data, [clickedColumn]),
        direction: "ascending"
      });
      return;
    }

    this.setState({
      data: data.reverse(),
      direction: direction === "ascending" ? "descending" : "ascending"
    });
  };

  render() {
    const { column, data, direction } = this.state;

    return (
      <Segment attached padded="very">
        <Table sortable fixed>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "name" ? direction : null}
                onClick={this.handleSort("name")}
              >
                Workflow
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="1"
                sorted={column === "run" ? direction : null}
                onClick={this.handleSort("run")}
              >
                Run
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "created" ? direction : null}
                onClick={this.handleSort("created")}
              >
                Created
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "duration" ? direction : null}
                onClick={this.handleSort("duration")}
              >
                Duration
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="8"
                sorted={column === "progress" ? direction : null}
                onClick={this.handleSort("progress")}
              >
                Progress
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="1"
                sorted={column === "status" ? direction : null}
                onClick={this.handleSort("status")}
              >
                Status
              </Table.HeaderCell>
              <Table.HeaderCell colSpan="4">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {_.map(data, ({ id, name, run, created, duration, status }) => (
              <Table.Row key={id}>
                <Table.Cell colSpan="2">{name}</Table.Cell>
                <Table.Cell colSpan="1">{run}</Table.Cell>
                <Table.Cell colSpan="2">{created}</Table.Cell>
                <Table.Cell colSpan="2">{duration}</Table.Cell>
                <Table.Cell colSpan="8">
                  <WorkflowProgress completed={0} total={0} status={status} />
                </Table.Cell>
                <Table.Cell colSpan="1">{status}</Table.Cell>
                <Table.Cell colSpan="4">
                  <WorkflowActions status={status} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan="20">
                <Menu floated="right" pagination>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron left" />
                  </Menu.Item>
                  <Menu.Item as="a">1</Menu.Item>
                  <Menu.Item as="a">2</Menu.Item>
                  <Menu.Item as="a">3</Menu.Item>
                  <Menu.Item as="a">4</Menu.Item>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron right" />
                  </Menu.Item>
                </Menu>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Segment>
    );
  }
}
