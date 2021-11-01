/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios from "axios";
import isEmpty from "lodash/isEmpty";

import { api } from "~/config";
import {
  parseWorkflows,
  parseLogs,
  parseFiles,
  stringifyQueryParams,
} from "~/util";
import {
  getConfig,
  getWorkflow,
  getWorkflowLogs,
  getWorkflowSpecification,
} from "~/selectors";

export const ERROR = "Error";
export const NOTIFICATION = "Notification";
export const CLEAR_NOTIFICATION = "Clear notification";

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
export const USER_EMAIL_CONFIRMATION = "User request email confirmation";
export const USER_EMAIL_CONFIRMED = "User email confirmed";
export const USER_EMAIL_CONFIRMATION_ERROR = "User email confirmation error";

export const QUOTA_FETCH = "Fetch user quota info";
export const QUOTA_RECEIVED = "User quota info received";
export const QUOTA_FETCH_ERROR = "User quota fetch error";

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
export const WORKFLOW_DELETE_INIT = "Initialize workflow deletion";
export const WORKFLOW_DELETED = "Workflow deleted";
export const OPEN_DELETE_WORKFLOW_MODAL = "Open delete workflow modal";
export const CLOSE_DELETE_WORKFLOW_MODAL = "Close delete workflow modal";
export const WORKFLOW_LIST_REFRESH = "Refresh workflow list";

const CONFIG_URL = `${api}/api/config`;
const USER_INFO_URL = `${api}/api/you`;
const USER_SIGNUP_URL = `${api}/api/register`;
const USER_SIGNIN_URL = `${api}/api/login`;
const USER_SIGNOUT_URL = `${api}/api/logout`;
const USER_REQUEST_TOKEN_URL = `${api}/api/token`;
const USER_CONFIRM_EMAIL_URL = `${api}/api/confirm-email`;
const WORKFLOWS_URL = (params) =>
  `${api}/api/workflows?verbose=true&${stringifyQueryParams(params)}`;
const WORKFLOW_LOGS_URL = (id) => `${api}/api/workflows/${id}/logs`;
const WORKFLOW_SPECIFICATION_URL = (id) =>
  `${api}/api/workflows/${id}/specification`;
const WORKFLOW_FILES_URL = (id, pagination) =>
  `${api}/api/workflows/${id}/workspace?${stringifyQueryParams(pagination)}`;

const WORKFLOW_SET_STATUS_URL = (id, status) =>
  `${api}/api/workflows/${id}/status?${stringifyQueryParams(status)}`;

const INTERACTIVE_SESSIONS_OPEN_URL = (id, type = "jupyter") =>
  `${api}/api/workflows/${id}/open/${type}`;

const INTERACTIVE_SESSIONS_CLOSE_URL = (id) =>
  `${api}/api/workflows/${id}/close/`;

export function errorActionCreator(error, name) {
  const { status, data } = error?.response;
  const { message } = data;
  return {
    type: ERROR,
    name,
    status,
    message,
    header: "An error has occurred",
  };
}

export function triggerNotification(header, message) {
  return { type: NOTIFICATION, header, message };
}

export const clearNotification = { type: CLEAR_NOTIFICATION };

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
    dispatch({ type: USER_FETCH });
    dispatch({ type: QUOTA_FETCH });
    return await axios
      .get(USER_INFO_URL, { withCredentials: true })
      .then((resp) => {
        dispatch({ type: USER_RECEIVED, ...resp.data });
        dispatch({ type: QUOTA_RECEIVED, ...resp.data });
      })
      .catch((err) => {
        // 403 Forbidden, user token was revoked.
        // 401 Unauthorized, user did not sign in, we fail silently.
        let errorData;
        if (err.response.status !== 401) {
          const {
            statusText,
            data: { message },
          } = err.response;
          errorData = { statusText, message };
          dispatch(errorActionCreator(err, USER_INFO_URL));
        }
        dispatch({ type: USER_FETCH_ERROR, ...errorData });
        dispatch({ type: QUOTA_FETCH_ERROR, ...errorData });
      });
  };
}

function userSignFactory(initAction, succeedAction, actionURL, body) {
  return async (dispatch, getStore) => {
    const state = getStore();
    const { userConfirmation } = getConfig(state);

    dispatch({ type: initAction });
    return await axios
      .post(actionURL, body, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      })
      .then((resp) => {
        dispatch(clearNotification);
        dispatch({ type: succeedAction });
        dispatch(loadUser());
        if (initAction === USER_SIGNUP) {
          dispatch(
            triggerNotification(
              "Success!",
              `User registered. ${
                userConfirmation
                  ? "Please confirm your email by clicking on the link we sent you."
                  : ""
              }`
            )
          );
        }
        return resp;
      })
      .catch((err) => {
        // validation errors
        if (err.response.data.errors) {
          dispatch({ type: USER_SIGN_ERROR, ...err.response.data });
        } else {
          dispatch(errorActionCreator(err, USER_SIGN_ERROR));
        }
        return err;
      });
  };
}

export const userSignup = (formData) =>
  userSignFactory(USER_SIGNUP, USER_SIGNEDUP, USER_SIGNUP_URL, formData);

export const userSignin = (formData) =>
  userSignFactory(USER_SIGNIN, USER_SIGNEDIN, USER_SIGNIN_URL, formData);

export function userSignout() {
  return async (dispatch) => {
    dispatch({ type: USER_SIGNOUT });
    return await axios
      .post(USER_SIGNOUT_URL, null, {
        withCredentials: true,
      })
      .then((resp) => {
        dispatch({ type: USER_SIGNEDOUT });
      })
      .catch((err) => {
        dispatch(errorActionCreator(err, USER_SIGNOUT_URL));
      });
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

export function confirmUserEmail(token) {
  return async (dispatch) => {
    dispatch({ type: USER_EMAIL_CONFIRMATION });
    return await axios
      .post(
        USER_CONFIRM_EMAIL_URL,
        { token: token },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((resp) => {
        dispatch({ type: USER_EMAIL_CONFIRMED });
        dispatch(triggerNotification("Success!", resp.data?.message));
      })
      .catch((err) => {
        // adapt error format coming from invenio-accounts (remove array)
        if (Array.isArray(err.response?.data?.message)) {
          err.response.data.message = err.response?.data?.message[0];
        }
        dispatch(errorActionCreator(err, USER_EMAIL_CONFIRMATION_ERROR));
      });
  };
}

export function fetchWorkflows(
  pagination,
  search,
  status,
  sort,
  showLoader = true
) {
  return async (dispatch) => {
    if (showLoader) {
      dispatch({ type: WORKFLOWS_FETCH });
    }
    const nameSearch = search ? JSON.stringify({ name: [search] }) : search;
    return await axios
      .get(
        WORKFLOWS_URL({
          ...pagination,
          search: nameSearch,
          status,
          sort,
        }),
        {
          withCredentials: true,
        }
      )
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
    if (!isEmpty(logs)) {
      return logs;
    }
    dispatch({ type: WORKFLOW_LOGS_FETCH });
    return await axios
      .get(WORKFLOW_LOGS_URL(id), { withCredentials: true })
      .then((resp) =>
        dispatch({
          type: WORKFLOW_LOGS_RECEIVED,
          id,
          logs: parseLogs(resp.data.logs),
        })
      )
      .catch((err) => {
        dispatch(errorActionCreator(err, WORKFLOW_LOGS_URL(id)));
      });
  };
}

export function fetchWorkflowFiles(id, pagination) {
  return async (dispatch) => {
    dispatch({ type: WORKFLOW_FILES_FETCH });
    return await axios
      .get(WORKFLOW_FILES_URL(id, pagination), { withCredentials: true })
      .then((resp) =>
        dispatch({
          type: WORKFLOW_FILES_RECEIVED,
          id,
          files: parseFiles(resp.data.items),
          total: resp.data.total,
        })
      )
      .catch((err) => {
        // 404 Not Found, workspace was deleted.
        if (err.response.status === 404) {
          dispatch({
            type: WORKFLOW_FILES_RECEIVED,
            id,
            files: null,
            total: 0,
          });
        } else {
          dispatch(errorActionCreator(err, WORKFLOW_FILES_URL(id, pagination)));
        }
      });
  };
}

export function fetchWorkflowSpecification(id) {
  return async (dispatch, getStore) => {
    const state = getStore();
    const specification = getWorkflowSpecification(id)(state);
    // Only fetch if needed
    if (!isEmpty(specification)) {
      return specification;
    }

    dispatch({ type: WORKFLOW_SPECIFICATION_FETCH });
    return await axios
      .get(WORKFLOW_SPECIFICATION_URL(id), {
        withCredentials: true,
      })
      .then((resp) =>
        dispatch({
          type: WORKFLOW_SPECIFICATION_RECEIVED,
          id,
          specification: resp.data.specification,
          parameters: resp.data.parameters,
        })
      )
      .catch((err) => {
        dispatch(errorActionCreator(err, WORKFLOW_SPECIFICATION_URL(id)));
      });
  };
}

export function deleteWorkflow(id, workspace = false) {
  return async (dispatch) => {
    dispatch({ type: WORKFLOW_DELETE_INIT });
    return await axios
      .put(
        WORKFLOW_SET_STATUS_URL(id, { status: "deleted" }),
        { workspace },
        { withCredentials: true }
      )
      .then((resp) => {
        dispatch({ type: WORKFLOW_DELETED, ...resp.data });
        dispatch({ type: WORKFLOW_LIST_REFRESH });
        dispatch(triggerNotification("Success!", resp.data.message));
      })
      .catch((err) => {
        dispatch(
          errorActionCreator(
            err,
            WORKFLOW_SET_STATUS_URL(id, { status: "deleted" })
          )
        );
      });
  };
}

export function openDeleteWorkflowModal(workflow) {
  return { type: OPEN_DELETE_WORKFLOW_MODAL, workflow };
}

export function closeDeleteWorkflowModal() {
  return { type: CLOSE_DELETE_WORKFLOW_MODAL };
}

export function openInteractiveSession(id) {
  return async (dispatch) => {
    return await axios
      .post(INTERACTIVE_SESSIONS_OPEN_URL(id), null, { withCredentials: true })
      .then((resp) => {
        dispatch({ type: WORKFLOW_LIST_REFRESH });
      })
      .catch((err) => {
        dispatch(errorActionCreator(err, INTERACTIVE_SESSIONS_OPEN_URL(id)));
      });
  };
}

export function closeInteractiveSession(id) {
  return async (dispatch) => {
    return await axios
      .post(INTERACTIVE_SESSIONS_CLOSE_URL(id), null, { withCredentials: true })
      .then((resp) => {
        dispatch({ type: WORKFLOW_LIST_REFRESH });
        dispatch(triggerNotification("Success!", resp.data.message));
      })
      .catch((err) => {
        dispatch(errorActionCreator(err, INTERACTIVE_SESSIONS_CLOSE_URL(id)));
      });
  };
}
