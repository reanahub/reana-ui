/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import history from "../history";
import { Redirect, Router, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoggedIn } from "../selectors";
import LoginPage from "../pages/login/Login";
import WorkflowsList from "../pages/workflowsList/WorkflowsList";
import WorkflowDetails from "../pages/workflowDetails/WorkflowDetails";
import GitLabProjects from "../pages/gitlabProjects/GitLabProjects";

function ProtectedRoute(props) {
  const loggedIn = useSelector(isLoggedIn);
  const { component: Component, render, ...restProps } = props;
  const renderContent = render ? render() : <Component {...restProps} />;
  return (
    <Route
      {...restProps}
      render={() => (loggedIn ? renderContent : <Redirect to="/" />)}
    />
  );
}

export default function App() {
  return (
    <Router history={history}>
      <div>
        <Route exact path="/" component={LoginPage} />
        <ProtectedRoute path="/projects" component={GitLabProjects} />
        <ProtectedRoute path="/workflows" component={WorkflowsList} />
        <ProtectedRoute path="/details" component={WorkflowDetails} />
      </div>
    </Router>
  );
}
