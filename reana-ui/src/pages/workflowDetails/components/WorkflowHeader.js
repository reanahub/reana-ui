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
import { Button, Grid, Segment } from "semantic-ui-react";
import { Link } from "react-router-dom";
import Config from "../../../config";
import axios from "axios";

export default class WorkflowHeader extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      name: "",
      created: "",
      status: "",
      token: this.props.token
    };
  }

  /**
   * Gets data from the specified API
   */
  getData() {
    const { id, token } = this.state;

    axios({
      method: "get",
      url: Config.api + "/api/workflows/" + id + "/status",
      params: {
        access_token: token
      }
    }).then(res => {
      let data = res.data;
      this.setState({
        name: data.name,
        created: data.created,
        status: data.status
      });
    });
  }

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    this.getData();
  }

  render() {
    const { name, created, status } = this.state;
    return (
      <Grid.Row>
        <Grid.Column>
          <Segment basic padded>
            <Link to="/workflows">
              <Button primary icon="angle left" size="big" />
            </Link>
          </Segment>
        </Grid.Column>
        <Grid.Column width={15}>
          <Segment.Group horizontal size="small">
            <Segment padded>
              <b>Name: </b>
              {name}
            </Segment>
            <Segment padded>
              <b>Created: </b>
              {created}
            </Segment>
            <Segment padded>
              <b>Status: </b>
              {status}
            </Segment>
          </Segment.Group>
        </Grid.Column>
      </Grid.Row>
    );
  }
}
