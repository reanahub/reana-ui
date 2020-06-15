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
import { Dimmer, Loader } from "semantic-ui-react";

import { getUserError, isLoggedIn, loadingUser } from "../selectors";
import Signin from "../pages/signin/Signin";
import WorkflowList from "../pages/workflowList/WorkflowList";
import WorkflowDetails from "../pages/workflowDetails/WorkflowDetails";
import Profile from "../pages/profile/Profile";
import Error from "./Error";

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
  const error = useSelector(getUserError);
  if (error) {
    return <Error title="Access denied" message={error} />;
  }

  return (
    <BrowserRouter>
      {loading ? (
        <Dimmer active inverted>
          <Loader inline="centered">Loading...</Loader>
        </Dimmer>
      ) : (
        <Switch>
          <Route
            path="/signin"
            render={() => (loggedIn ? <Redirect to="/" /> : <Signin />)}
          />
          <Route
            path="/signup"
            render={() => (loggedIn ? <Redirect to="/" /> : <Signin signup />)}
          />
          <ProtectedRoute exact path="/" component={WorkflowList} />
          <ProtectedRoute path="/details/:id" component={WorkflowDetails} />
          <ProtectedRoute path="/profile" component={Profile} />
        </Switch>
      )}
    </BrowserRouter>
  );
}
