/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import axios from "axios";
import _ from "lodash";
import history from "../../../history";
import { Icon, Menu, Segment, Table } from "semantic-ui-react";
import WorkflowsProgress from "./WorkflowsProgress";
import WorkflowsActions from "./WorkflowsActions";
import Config from "../../../config";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default class WorkflowsList extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.interval = null;
    this.state = {
      column: null,
      data: [],
      direction: null
    };
  }

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

    data.forEach(wf => {
      let info = wf["name"].split(".");
      wf["name"] = info[0];
      wf["run"] = info[1];

      let date = new Date(wf["created"]);
      wf["created"] = wf["created"].replace("T", " ");
      wf["duration"] = WorkflowsList.msToTime(Date.now() - date.getTime());
    });

    return data;
  }

  /**
   * Gets data from the specified API
   */
  getWorkflows() {
    axios({
      method: "get",
      url: Config.api + "/api/workflows",
      withCredentials: true
    }).then(res => {
      let data = WorkflowsList.parseData(res.data);
      this.setState({ data: data });

      this.updateProgresses();
      this.interval = setInterval(() => {
        this.updateProgresses();
      }, Config.pooling_secs * 1000);
    });
  }

  /**
   * Gets data from the specified API
   */
  updateProgresses() {
    const { data } = this.state;

    data.forEach(wf => {
      axios({
        method: "get",
        url: Config.api + "/api/workflows/" + wf["id"] + "/status",
        withCredentials: true
      }).then(res => {
        let progress = res.data.progress.finished;
        let total = res.data.progress.total;
        wf["completed"] = typeof progress === "object" ? progress.total : 0;
        wf["total"] = total.total;

        let date = new Date(res.data.created);
        wf["duration"] = WorkflowsList.msToTime(Date.now() - date.getTime());

        this.setState({ data: data });
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
      this.getWorkflows();
    }
  }

  /**
   * Default runnable method when the component is unloaded
   */
  componentWillUnmount() {
    clearInterval(this.interval);
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
      <Segment basic padded>
        <Table sortable fixed>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "name" ? direction : null}
                onClick={this.handleSort("name")}
              >
                Name
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
            {_.map(
              data,
              ({
                id,
                name,
                run,
                created,
                duration,
                completed,
                total,
                status
              }) => (
                <Table.Row key={id}>
                  <Table.Cell colSpan="2">{name}</Table.Cell>
                  <Table.Cell colSpan="1">{run}</Table.Cell>
                  <Table.Cell colSpan="2">{created}</Table.Cell>
                  <Table.Cell colSpan="2">{duration}</Table.Cell>
                  <Table.Cell colSpan="8">
                    <WorkflowsProgress
                      completed={completed}
                      total={total}
                      status={status}
                    />
                  </Table.Cell>
                  <Table.Cell colSpan="1">{status}</Table.Cell>
                  <Table.Cell colSpan="4">
                    <WorkflowsActions
                      id={id}
                      name={name}
                      run={run}
                      created={created}
                      status={status}
                    />
                  </Table.Cell>
                </Table.Row>
              )
            )}
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
