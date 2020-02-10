/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Redirect, BrowserRouter, Route, Switch } from "react-router-dom";
import { useSelector } from "react-redux";
import { isLoggedIn, loadingUser } from "../selectors";
import LoginPage from "../pages/login/Login";
import WorkflowList from "../pages/workflowList/WorkflowList";
import WorkflowDetails from "../pages/workflowDetails/WorkflowDetails";
import Profile from "../pages/profile/Profile";

import "./App.module.scss";

function ProtectedRoute(props) {
  const loggedIn = useSelector(isLoggedIn);
  const { component: Component, render, ...restProps } = props;
  const renderContent = render ? render() : <Component {...restProps} />;
  return (
    <Route
      {...restProps}
      render={() => (loggedIn ? renderContent : <Redirect to="/signin" />)}
    />
  );
}

export default function App() {
  const loading = useSelector(loadingUser);
  const loggedIn = useSelector(isLoggedIn);
  return (
    <BrowserRouter>
      {loading ? (
        // TODO: Change for a better loading indicator
        "Loading..."
      ) : (
        <Switch>
          <Route
            path="/signin"
            render={() => (loggedIn ? <Redirect to="/" /> : <LoginPage />)}
          />
          <ProtectedRoute exact path="/" component={WorkflowList} />
          <ProtectedRoute path="/details/:id" component={WorkflowDetails} />
          <ProtectedRoute path="/profile" component={Profile} />
        </Switch>
      )}
    </BrowserRouter>
  );
}
