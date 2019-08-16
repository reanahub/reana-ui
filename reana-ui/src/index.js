/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import ReactDOM from "react-dom";
import { Router, Route } from "react-router-dom";
import history from "./history";
import LoginPage from "./pages/login/Login";
import WorkflowsList from "./pages/workflowsList/WorkflowsList";
import WorkflowDetails from "./pages/workflowDetails/WorkflowDetails";
import GitLabProjects from "./pages/gitlabProjects/GitLabProjects";
import "semantic-ui-css/semantic.min.css";

ReactDOM.render(
  <Router history={history}>
    <div>
      <Route exact path="/" component={LoginPage} />
      <Route path="/workflows" component={WorkflowsList} />
      <Route path="/details" component={WorkflowDetails} />
      <Route path="/projects" component={GitLabProjects} />
    </div>
  </Router>,
  document.getElementById("root")
);
