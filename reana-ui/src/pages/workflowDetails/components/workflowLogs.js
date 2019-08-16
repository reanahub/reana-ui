/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import axios from "axios";
import { Header, Segment } from "semantic-ui-react";
import Config from "../../../config";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default class WorkflowLogs extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.url = Config.api + "/api/workflows/" + cookies.get("workflow-id");
    this.state = {
      logs: ""
    };
  }

  /**
   * Gets data from the specified API
   */
  getLogs() {
    axios({
      method: "get",
      url: this.url + "/logs",
      withCredentials: true
    }).then(res => {
      this.setState({
        logs: res.data.logs
      });
    });
  }

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    this.getLogs();
  }

  render() {
    const { logs } = this.state;

    return (
      <Segment raised secondary className="logs-area">
        <Header size="medium">Logs</Header>
        <pre>{logs}</pre>
      </Segment>
    );
  }
}
