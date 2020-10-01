/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import axios from "axios";

import { api } from "./config";
import {
  parseWorkflows,
  parseLogs,
  parseFiles,
  stringifyQueryParams,
} from "./util";
import {
  getWorkflow,
  getWorkflowLogs,
  getWorkflowSpecification,
} from "./selectors";

export const ERROR = "Error";
export const CLEAR_ERROR = "Clear error";

export const CONFIG_FETCH = "Fetch app config info";
export const CONFIG_RECEIVED = "App config info received";
export const CONFIG_ERROR = "Fetch app config error";

export const USER_FETCH = "Fetch user authentication info";
export const USER_RECEIVED = "User info received";
export const USER_FETCH_ERROR = "User fetch error";
export const USER_SIGNUP = "Sign user up";
export const USER_SIGNEDUP = "User signed up";
export const USER_SIGNIN = "Sign user in";
export const USER_SIGNEDIN = "User signed in";
export const USER_SIGNOUT = "Sign user out";
export const USER_SIGN_ERROR = "User sign in/up error";
export const USER_SIGNEDOUT = "User signed out";
export const USER_REQUEST_TOKEN = "Request user token";
export const USER_TOKEN_REQUESTED = "User token requested";
export const USER_TOKEN_ERROR = "User token error";

export const WORKFLOWS_FETCH = "Fetch workflows info";
export const WORKFLOWS_RECEIVED = "Workflows info received";
export const WORKFLOWS_FETCH_ERROR = "Workflows fetch error";
export const WORKFLOW_LOGS_FETCH = "Fetch workflow logs";
export const WORKFLOW_LOGS_RECEIVED = "Workflow logs received";
export const WORKFLOW_FILES_FETCH = "Fetch workflow files";
export const WORKFLOW_FILES_RECEIVED = "Workflow files received";
export const WORKFLOW_SPECIFICATION_FETCH = "Fetch workflow specification";
export const WORKFLOW_SPECIFICATION_RECEIVED =
  "Workflow specification received";

const CONFIG_URL = `${api}/api/config`;
const USER_INFO_URL = `${api}/api/you`;
const USER_SIGNUP_URL = `${api}/api/register`;
const USER_SIGNIN_URL = `${api}/api/login`;
const USER_SIGNOUT_URL = `${api}/api/logout`;
const USER_REQUEST_TOKEN_URL = `${api}/api/token`;
const WORKFLOWS_URL = (params) =>
  `${api}/api/workflows?${stringifyQueryParams(params)}`;
const WORKFLOW_LOGS_URL = (id) => `${api}/api/workflows/${id}/logs`;
const WORKFLOW_SPECIFICATION_URL = (id) =>
  `${api}/api/workflows/${id}/specification`;
const WORKFLOW_FILES_URL = (id, pagination) =>
  `${api}/api/workflows/${id}/workspace?${stringifyQueryParams(pagination)}`;

function errorActionCreator(error, name) {
  const { status, data } = error?.response;
  const { message } = data;
  return { type: ERROR, name, status, message };
}

export const clearError = { type: CLEAR_ERROR };

export function loadConfig() {
  return async (dispatch) => {
    dispatch({ type: CONFIG_FETCH });
    return await axios
      .get(CONFIG_URL, { withCredentials: true })
      .then((resp) => dispatch({ type: CONFIG_RECEIVED, ...resp.data }))
      .catch((err) => {
        dispatch(errorActionCreator(err, CONFIG_URL));
        dispatch({ type: CONFIG_ERROR });
      });
  };
}

export function loadUser() {
  return async (dispatch) => {
    let resp, data;
    try {
      dispatch({ type: USER_FETCH });
      resp = await fetch(USER_INFO_URL, { credentials: "include" });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.status === 403) {
      data = await resp.json();
      dispatch({ type: USER_FETCH_ERROR, ...data });
    } else if (resp.ok) {
      data = await resp.json();
    }
    dispatch({ type: USER_RECEIVED, ...data });
    return resp;
  };
}

function userSignFactory(initAction, succeedAction, actionURL, body) {
  return async (dispatch) => {
    let resp, data;
    try {
      dispatch({ type: initAction });
      resp = await fetch(actionURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });
    } catch (err) {
      throw new Error(actionURL, 0, err);
    }
    data = await resp.json();
    if (resp.status === 400) {
      dispatch({ type: USER_SIGN_ERROR, ...data });
    } else if (resp.ok) {
      dispatch({ type: succeedAction });
      dispatch(loadUser());
    }
    return resp;
  };
}

export const userSignup = (formData) =>
  userSignFactory(USER_SIGNUP, USER_SIGNEDUP, USER_SIGNUP_URL, formData);

export const userSignin = (formData) =>
  userSignFactory(USER_SIGNIN, USER_SIGNEDIN, USER_SIGNIN_URL, formData);

export function userSignout() {
  return async (dispatch) => {
    let resp;
    try {
      dispatch({ type: USER_SIGNOUT });
      resp = await fetch(USER_SIGNOUT_URL, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      throw new Error(USER_SIGNOUT_URL, 0, err);
    }
    if (resp.ok) {
      dispatch({ type: USER_SIGNEDOUT });
    }
    return resp;
  };
}

export function requestToken() {
  return async (dispatch) => {
    dispatch({ type: USER_REQUEST_TOKEN });
    return await axios
      .put(USER_REQUEST_TOKEN_URL, null, { withCredentials: true })
      .then((resp) => dispatch({ type: USER_TOKEN_REQUESTED, ...resp.data }))
      .catch((err) => {
        dispatch(errorActionCreator(err, USER_INFO_URL));
        dispatch({ type: USER_TOKEN_ERROR });
      });
  };
}

export function fetchWorkflows(pagination, search, status, sortDir) {
  return async (dispatch) => {
    dispatch({ type: WORKFLOWS_FETCH });
    return await axios
      .get(WORKFLOWS_URL({ ...pagination, search, status, sortDir }), {
        withCredentials: true,
      })
      .then((resp) =>
        dispatch({
          type: WORKFLOWS_RECEIVED,
          workflows: parseWorkflows(resp.data.items),
          total: resp.data.total,
          userHasWorkflows: resp.data.user_has_workflows,
        })
      )
      .catch((err) => {
        dispatch(errorActionCreator(err, USER_INFO_URL));
        dispatch({ type: WORKFLOWS_FETCH_ERROR });
      });
  };
}

export function fetchWorkflow(id) {
  return async (dispatch, getStore) => {
    const state = getStore();
    const workflow = getWorkflow(id)(state);
    // Only fetch if needed
    if (workflow) {
      return workflow;
    } else {
      dispatch(fetchWorkflows());
    }
  };
}

export function fetchWorkflowLogs(id) {
  return async (dispatch, getStore) => {
    const state = getStore();
    const logs = getWorkflowLogs(id)(state);
    // Only fetch if needed
    if (!_.isEmpty(logs)) {
      return logs;
    }
    let resp, data;
    try {
      dispatch({ type: WORKFLOW_LOGS_FETCH });
      resp = await fetch(WORKFLOW_LOGS_URL(id), { credentials: "include" });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.ok) {
      data = await resp.json();
    }
    dispatch({
      type: WORKFLOW_LOGS_RECEIVED,
      id,
      logs: parseLogs(data.logs),
    });
    return resp;
  };
}

export function fetchWorkflowFiles(id, pagination) {
  return async (dispatch, getStore) => {
    let resp, data;
    try {
      dispatch({ type: WORKFLOW_FILES_FETCH });
      resp = await fetch(WORKFLOW_FILES_URL(id, pagination), {
        credentials: "include",
      });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.ok) {
      data = await resp.json();
    }
    dispatch({
      type: WORKFLOW_FILES_RECEIVED,
      id,
      files: parseFiles(data.items),
      total: data.total,
    });
    return resp;
  };
}

export function fetchWorkflowSpecification(id) {
  return async (dispatch, getStore) => {
    const state = getStore();
    const specification = getWorkflowSpecification(id)(state);
    // Only fetch if needed
    if (!_.isEmpty(specification)) {
      return specification;
    }
    let resp, data;
    try {
      dispatch({ type: WORKFLOW_SPECIFICATION_FETCH });
      resp = await fetch(WORKFLOW_SPECIFICATION_URL(id), {
        credentials: "include",
      });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.ok) {
      data = await resp.json();
    }
    dispatch({
      type: WORKFLOW_SPECIFICATION_RECEIVED,
      id,
      specification: data.specification,
      parameters: data.parameters,
    });
    return resp;
  };
}
