/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import TopHeader from "../../components/TopHeader";
import WorkflowHeader from "./components/WorkflowHeader";
import WorkflowSpace from "./components/WorkflowSpace";

export default class WorkflowDetailsPage extends Component {
  render() {
    return (
      <div>
        <TopHeader />
        <WorkflowHeader />
        <WorkflowSpace />
      </div>
    );
  }
}
