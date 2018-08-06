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
import { Progress } from "semantic-ui-react";

export default class WorkflowsProgress extends Component {
  static handleActive(status) {
    return status === "running";
  }

  static handleColor(status) {
    if (status === "created") {
      return "grey";
    }
    if (status === "running") {
      return "blue";
    } else if (status === "finished") {
      return "green";
    } else if (status === "failed") {
      return "red";
    }
  }

  static handlePercentage(completedSteps, totalSteps) {
    return Math.floor((completedSteps * 100) / totalSteps);
  }

  render() {
    return (
      <Progress
        size="small"
        percent={WorkflowsProgress.handlePercentage(
          this.props.completed,
          this.props.total
        )}
        color={WorkflowsProgress.handleColor(this.props.status)}
        active={WorkflowsProgress.handleActive(this.props.status)}
      >
        {this.props.completed} / {this.props.total}
      </Progress>
    );
  }
}
