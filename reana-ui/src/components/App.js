/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEmpty from "lodash/isEmpty";
import { Redirect, BrowserRouter, Route, Switch } from "react-router-dom";
import { useSelector } from "react-redux";
import { Dimmer, Loader } from "semantic-ui-react";

import {
  getUserFetchError,
  isSignedIn,
  isSignupHidden,
  loadingUser,
  loadingConfig,
} from "~/selectors";
import Confirm from "~/pages/signin/Confirm";
import Signin from "~/pages/signin/Signin";
import Signup from "~/pages/signin/Signup";
import OAuthSignin from "~/pages/signin/OAuthSignin";
import WorkflowList from "~/pages/workflowList/WorkflowList";
import WorkflowDetails from "~/pages/workflowDetails/WorkflowDetails";
import Profile from "~/pages/profile/Profile";
import PrivacyNotice from "~/pages/privacyNotice/PrivacyNotice";
import Status from "~/pages/status/Status";
import LaunchOnReana from "~/pages/launchOnReana/LaunchOnReana";
import NotFound from "~/pages/error/NotFound";
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
  const userLoading = useSelector(loadingUser);
  const configLoading = useSelector(loadingConfig);
  const loading = userLoading || configLoading;
  const signedIn = useSelector(isSignedIn);
  const signupHidden = useSelector(isSignupHidden);
  const error = useSelector(getUserFetchError);
  if (!isEmpty(error)) {
    return <Error title={error.statusText} message={error.message} />;
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
            render={() =>
              signedIn || signupHidden ? <Redirect to="/" /> : <Signup />
            }
          />
          <Route path="/confirm/:token" component={Confirm} />
          <Route path="/privacy-notice" component={PrivacyNotice} />
          <Route path="/signin_callback" component={OAuthSignin} />
          <ProtectedRoute exact path="/" component={WorkflowList} />
          <ProtectedRoute path="/details/:id" component={WorkflowDetails} />
          <ProtectedRoute path="/profile" component={Profile} />
          <ProtectedRoute path="/status" component={Status} />
          <ProtectedRoute exact path="/launch" component={LaunchOnReana} />
          <ProtectedRoute path="/404" component={NotFound} />
          <Redirect to="/404" />
        </Switch>
      )}
    </BrowserRouter>
  );
}
