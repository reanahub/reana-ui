/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import { Progress } from "semantic-ui-react";

export default class WorkflowsProgress extends Component {
  static handleActive(status) {
    return status === "running";
  }

  static handleColor(status) {
    if (status === "created") {
      return "gray";
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
