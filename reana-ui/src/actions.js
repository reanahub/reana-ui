/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";

import config from "./config";
import { parseWorkflows, parseLogs, parseFiles } from "./util";
import {
  getWorkflow,
  getWorkflowFiles,
  getWorkflowLogs,
  getWorkflowSpecification
} from "./selectors";

export const USER_FETCH = "Fetch user authentication info";
export const USER_RECEIVED = "User info received";
export const USER_ERROR = "User fetch error";
export const USER_SIGNUP = "Sign user up";
export const USER_SIGNEDUP = "User signed up";
export const USER_SIGNIN = "Sign user in";
export const USER_SIGNEDIN = "User signed in";
export const USER_SIGNOUT = "User signed out";
export const USER_REQUEST_TOKEN = "Request user token";
export const USER_TOKEN_REQUESTED = "User token requested";

export const WORKFLOWS_FETCH = "Fetch workflows info";
export const WORKFLOWS_RECEIVED = "Workflows info received";
export const WORKFLOW_LOGS_FETCH = "Fetch workflow logs";
export const WORKFLOW_LOGS_RECEIVED = "Workflow logs received";
export const WORKFLOW_FILES_FETCH = "Fetch workflow files";
export const WORKFLOW_FILES_RECEIVED = "Workflow files received";
export const WORKFLOW_SPECIFICATION_FETCH = "Fetch workflow specification";
export const WORKFLOW_SPECIFICATION_RECEIVED =
  "Workflow specification received";

const USER_INFO_URL = `${config.api}/api/you`;
const USER_SIGNUP_URL = `${config.api}/api/register`;
const USER_SIGNIN_URL = `${config.api}/api/login`;
const USER_SIGNOUT_URL = `${config.api}/api/logout`;
const USER_REQUEST_TOKEN_URL = `${config.api}/api/token`;
const WORKFLOWS_URL = `${config.api}/api/workflows`;
const WORKFLOW_LOGS_URL = id => `${config.api}/api/workflows/${id}/logs`;
const WORKFLOW_SPECIFICATION_URL = id =>
  `${config.api}/api/workflows/${id}/specification`;
const WORKFLOW_FILES_URL = id => `${config.api}/api/workflows/${id}/workspace`;

export function loadUser() {
  return async dispatch => {
    let resp, data;
    try {
      dispatch({ type: USER_FETCH });
      resp = await fetch(USER_INFO_URL, { credentials: "include" });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.status === 403) {
      data = await resp.json();
      dispatch({ type: USER_ERROR, ...data });
    } else if (resp.ok) {
      data = await resp.json();
    }
    dispatch({ type: USER_RECEIVED, ...data });
    return resp;
  };
}

function userSignFactory(initAction, succeedAction, actionURL, body) {
  return async dispatch => {
    let resp, data;
    try {
      dispatch({ type: initAction });
      resp = await fetch(actionURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        credentials: "include"
      });
    } catch (err) {
      throw new Error(actionURL, 0, err);
    }
    data = await resp.json();
    if (resp.status === 400) {
      // TODO: Error validation and error messages in form
      console.log(data);
    } else if (resp.ok) {
      dispatch({ type: succeedAction });
      dispatch(loadUser());
    }
    return resp;
  };
}

export const userSignup = formData =>
  userSignFactory(USER_SIGNUP, USER_SIGNEDUP, USER_SIGNUP_URL, formData);

export const userSignin = formData =>
  userSignFactory(USER_SIGNIN, USER_SIGNEDIN, USER_SIGNIN_URL, formData);

export function userSignout() {
  return async dispatch => {
    dispatch({ type: USER_SIGNOUT });
    window.location.href = USER_SIGNOUT_URL;
  };
}

export function requestToken() {
  return async dispatch => {
    let resp, data;
    try {
      dispatch({ type: USER_REQUEST_TOKEN });
      resp = await fetch(USER_REQUEST_TOKEN_URL, {
        method: "PUT",
        credentials: "include"
      });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.status === 401) {
      data = await resp.json();
      console.log(data.message);
    } else if (resp.ok) {
      data = await resp.json();
    }
    dispatch({ type: USER_TOKEN_REQUESTED, ...data });
    return resp;
  };
}

export function fetchWorkflows() {
  return async dispatch => {
    let resp, data;
    try {
      dispatch({ type: WORKFLOWS_FETCH });
      resp = await fetch(WORKFLOWS_URL, { credentials: "include" });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.ok) {
      data = await resp.json();
    }
    dispatch({ type: WORKFLOWS_RECEIVED, workflows: parseWorkflows(data) });
    return resp;
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
      logs: parseLogs(data.logs)
    });
    return resp;
  };
}

export function fetchWorkflowFiles(id) {
  return async (dispatch, getStore) => {
    const state = getStore();
    const files = getWorkflowFiles(id)(state);
    // Only fetch if needed
    if (!_.isEmpty(files)) {
      return files;
    }
    let resp, data;
    try {
      dispatch({ type: WORKFLOW_FILES_FETCH });
      resp = await fetch(WORKFLOW_FILES_URL(id), { credentials: "include" });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.ok) {
      data = await resp.json();
    }
    dispatch({
      type: WORKFLOW_FILES_RECEIVED,
      id,
      files: parseFiles(data)
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
        credentials: "include"
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
      parameters: data.parameters
    });
    return resp;
  };
}
