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

import { getUserFetchError, isSignedIn, loadingUser } from "~/selectors";
import Signin from "~/pages/signin/Signin";
import WorkflowList from "~/pages/workflowList/WorkflowList";
import WorkflowDetails from "~/pages/workflowDetails/WorkflowDetails";
import Profile from "~/pages/profile/Profile";
import Error from "./Error";

import "./App.module.scss";

function ProtectedRoute(props) {
  const signedIn = useSelector(isSignedIn);
  const { component: Component, render, ...restProps } = props;
  const renderContent = render ? render() : <Component {...restProps} />;
  return (
    <Route
      {...restProps}
      render={({ location }) =>
        signedIn ? (
          renderContent
        ) : (
          <Redirect to={{ pathname: "/signin", state: { from: location } }} />
        )
      }
    />
  );
}

export default function App() {
  const loading = useSelector(loadingUser);
  const signedIn = useSelector(isSignedIn);
  const error = useSelector(getUserFetchError);
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
            render={() => (signedIn ? <Redirect to="/" /> : <Signin />)}
          />
          <Route
            path="/signup"
            render={() => (signedIn ? <Redirect to="/" /> : <Signin signup />)}
          />
          <ProtectedRoute exact path="/" component={WorkflowList} />
          <ProtectedRoute path="/details/:id" component={WorkflowDetails} />
          <ProtectedRoute path="/profile" component={Profile} />
        </Switch>
      )}
    </BrowserRouter>
  );
}
