/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import history from "../history";
import { Redirect, Router, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoggedIn, loadingUser } from "../selectors";
import LoginPage from "../pages/login/Login";
import WorkflowsList from "../pages/workflowsList/WorkflowsList";
import WorkflowDetails from "../pages/workflowDetails/WorkflowDetails";
import GitLabProjects from "../pages/gitlabProjects/GitLabProjects";

import "./App.module.scss";

function ProtectedRoute(props) {
  const loggedIn = useSelector(isLoggedIn);
  const { component: Component, render, ...restProps } = props;
  const renderContent = render ? render() : <Component {...restProps} />;
  return (
    <Route
      {...restProps}
      render={() => (loggedIn ? renderContent : <Redirect to="/login" />)}
    />
  );
}

export default function App() {
  const loading = useSelector(loadingUser);
  const loggedIn = useSelector(isLoggedIn);
  return (
    <Router history={history}>
      <>
        {loading ? (
          "Loading..."
        ) : (
          <>
            <Route
              path="/login"
              render={() => (loggedIn ? <Redirect to="/" /> : <LoginPage />)}
            />
            <ProtectedRoute exact path="/" component={WorkflowsList} />
            <ProtectedRoute path="/projects" component={GitLabProjects} />
            <ProtectedRoute path="/details" component={WorkflowDetails} />
          </>
        )}
      </>
    </Router>
  );
}
