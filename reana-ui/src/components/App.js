/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019, 2020, 2021, 2022, 2023, 2024, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEmpty from "lodash/isEmpty";
import {
  Navigate,
  BrowserRouter,
  Route,
  Routes,
  useParams,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dimmer, Loader } from "semantic-ui-react";

import { loadUser } from "~/actions";
import {
  getUserFetchError,
  isSignedIn,
  loadingUser,
  loadingConfig,
} from "~/selectors";
import Signin from "~/pages/signin/Signin";
import WorkflowList from "~/pages/workflowList/WorkflowList";
import WorkflowDetails from "~/pages/workflowDetails/WorkflowDetails";
import Profile from "~/pages/profile/Profile";
import Status from "~/pages/status/Status";
import LaunchOnReana from "~/pages/launchOnReana/LaunchOnReana";
import AccessNotGranted from "~/pages/error/AccessNotGranted";
import NotFound from "~/pages/error/NotFound";
import Error from "./Error";

import "./App.module.scss";
import LauncherBadgeCreator from "~/pages/badgeCreator/LauncherBadgeCreator";

function RequireAuth({ children }) {
  const signedIn = useSelector(isSignedIn);
  const location = useLocation();
  if (signedIn) {
    return children;
  } else {
    return <Navigate to="/signin" state={{ from: location }} />;
  }
}

function RedirectDetailsToWorkflows() {
  const { id } = useParams();
  const location = useLocation();
  return <Navigate to={`/workflows/${id}${location.search}`} replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const userLoading = useSelector(loadingUser);
  const configLoading = useSelector(loadingConfig);
  const loading = userLoading || configLoading;
  const signedIn = useSelector(isSignedIn);
  const error = useSelector(getUserFetchError);
  if (error?.status === 403 && error?.code === "access_not_granted") {
    return <AccessNotGranted />;
  }
  if (!isEmpty(error)) {
    return (
      <Error
        title={error.statusText}
        message={error.message}
        action={<Button onClick={() => dispatch(loadUser())}>Retry</Button>}
      />
    );
  }
  return (
    <BrowserRouter>
      {loading ? (
        <Dimmer active inverted>
          <Loader inline="centered">Loading...</Loader>
        </Dimmer>
      ) : (
        <Routes>
          <Route
            path="/signin"
            element={signedIn ? <Navigate to="/" /> : <Signin />}
          />
          <Route path="/signup" element={<Navigate to="/" />} />
          <Route path="/confirm/:token" element={<Navigate to="/" />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <WorkflowList />
              </RequireAuth>
            }
          />
          <Route
            path="/workflows/:id/:tab?/:job?"
            element={
              <RequireAuth>
                <WorkflowDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/details/:id/:tab?/:job?"
            element={
              <RequireAuth>
                <RedirectDetailsToWorkflows />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/status"
            element={
              <RequireAuth>
                <Status />
              </RequireAuth>
            }
          />
          <Route
            path="/launch"
            element={
              <RequireAuth>
                <LaunchOnReana />
              </RequireAuth>
            }
          />
          <Route
            path="/launcher-badge"
            element={
              <RequireAuth>
                <LauncherBadgeCreator />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <NotFound />
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}
