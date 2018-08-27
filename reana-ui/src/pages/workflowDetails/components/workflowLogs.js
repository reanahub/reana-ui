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
      params: {
        access_token: cookies.get("user_token")
      }
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
