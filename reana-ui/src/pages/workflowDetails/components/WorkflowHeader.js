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
import { Button, Segment } from "semantic-ui-react";
import { Link } from "react-router-dom";
import State from "../../../state";

export default class WorkflowHeader extends Component {
  render() {
    return (
      <Segment basic clearing className="workflow_header">
        <Segment basic floated="left">
          <Link to="/workflows">
            <Button primary icon="angle left" size="big" />
          </Link>
        </Segment>

        <Segment.Group horizontal size="large" floated="right">
          <Segment>
            <b>Name: </b>
            {State.details.name}
          </Segment>
          <Segment>
            <b>Run: </b>
            {State.details.run}
          </Segment>
          <Segment>
            <b>Created: </b>
            {State.details.created}
          </Segment>
          <Segment>
            <b>Status: </b>
            {State.details.status}
          </Segment>
        </Segment.Group>
      </Segment>
    );
  }
}
