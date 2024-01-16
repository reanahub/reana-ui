/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { combineReducers } from "redux";
import {
  ERROR,
  NOTIFICATION,
  CLEAR_NOTIFICATION,
  CONFIG_FETCH,
  CONFIG_RECEIVED,
  CONFIG_ERROR,
  USER_FETCH,
  USER_RECEIVED,
  USER_FETCH_ERROR,
  USER_SIGNEDOUT,
  USER_SIGN_ERROR,
  USER_REQUEST_TOKEN,
  USER_TOKEN_REQUESTED,
  USER_TOKEN_ERROR,
  QUOTA_FETCH,
  QUOTA_RECEIVED,
  QUOTA_FETCH_ERROR,
  WORKFLOWS_FETCH,
  WORKFLOWS_RECEIVED,
  WORKFLOWS_FETCH_ERROR,
  WORKFLOW_LIST_REFRESH,
  WORKFLOW_LOGS_FETCH,
  WORKFLOW_LOGS_RECEIVED,
  WORKFLOW_SPECIFICATION_FETCH,
  WORKFLOW_SPECIFICATION_RECEIVED,
  WORKFLOW_FILES_FETCH,
  WORKFLOW_FILES_RECEIVED,
  WORKFLOW_RETENTION_RULES_RECEIVED,
  OPEN_DELETE_WORKFLOW_MODAL,
  CLOSE_DELETE_WORKFLOW_MODAL,
  OPEN_STOP_WORKFLOW_MODAL,
  CLOSE_STOP_WORKFLOW_MODAL,
  WARNING,
  USERS_SHARED_WITH_YOU_FETCH,
  USERS_SHARED_WITH_YOU_RECEIVED,
  USERS_SHARED_WITH_YOU_FETCH_ERROR,
  USERS_YOU_SHARED_WITH_FETCH,
  USERS_YOU_SHARED_WITH_RECEIVED,
  USERS_YOU_SHARED_WITH_FETCH_ERROR,
} from "~/actions";
import { USER_ERROR } from "./errors";

const notificationInitialState = null;

export const configInitialState = {
  announcement: null,
  pollingSecs: null,
  docsURL: null,
  clientPyvenv: null,
  forumURL: null,
  chatURL: null,
  cernSSO: false,
  loginProviderConfig: null,
  cernRopo: false,
  adminEmail: null,
  maxInteractiveSessionInactivityPeriod: null,
  localUsers: false,
  hideSignup: false,
  isLoaded: false,
  userConfirmation: true,
  loading: false,
  filePreviewSizeLimit: null,
  launcherExamples: [],
};

const authInitialState = {
  email: null,
  reanaToken: {
    value: null,
    status: null,
    requestedAt: null,
    loading: false,
  },
  loadingUser: false,
  error: {},
};

const workflowsInitialState = {
  workflows: null,
  workflowsFetched: false,
  loadingWorkflows: false,
  total: null,
  userHasWorkflows: false,
  workflowDeleteModal: { open: false, workflow: null },
  workflowStopModal: { open: false, workflow: null },
  workflowRefresh: null,
};

const detailsInitialState = {
  details: {},
  loadingDetails: false,
};

const quotaInitialState = {
  cpu: {},
  disk: {},
};

const sharingInitialState = {
  usersSharedWithYou: [],
  usersYouSharedWith: [],
};

const notification = (state = notificationInitialState, action) => {
  const { name, status, message, header } = action;
  switch (action.type) {
    case ERROR:
    case WARNING:
    case NOTIFICATION:
      return {
        ...state,
        name,
        status,
        message,
        header,
        isError: action.type === ERROR,
        isWarning: action.type === WARNING,
      };
    case CLEAR_NOTIFICATION:
      return notificationInitialState;
    default:
      return state;
  }
};

const config = (state = configInitialState, action) => {
  switch (action.type) {
    case CONFIG_FETCH:
      return { ...state, loading: true };
    case CONFIG_RECEIVED:
      return {
        ...state,
        announcement: action.announcement,
        pollingSecs: action.polling_secs,
        docsURL: action.docs_url,
        clientPyvenv: action.client_pyvenv,
        forumURL: action.forum_url,
        chatURL: action.chat_url,
        cernSSO: action.cern_sso,
        loginProviderConfig: action.login_provider_config,
        cernRopo: action.cern_ropo,
        adminEmail: action.admin_email,
        maxInteractiveSessionInactivityPeriod:
          action.maximum_interactive_session_inactivity_period,
        localUsers: action.local_users,
        hideSignup: action.hide_signup,
        userConfirmation: action.user_confirmation,
        quotaEnabled: action.quota_enabled,
        filePreviewSizeLimit: action.file_preview_size_limit,
        launcherExamples: action.launcher_examples,
        isLoaded: true,
        loading: false,
      };
    case CONFIG_ERROR:
      return { ...state, isLoaded: false, loading: false };
    default:
      return state;
  }
};

const auth = (state = authInitialState, action) => {
  switch (action.type) {
    case USER_FETCH:
      return { ...state, loadingUser: action.loader };
    case USER_RECEIVED:
      return {
        ...state,
        email: action.email,
        fullName: action.full_name,
        username: action.username,
        reanaToken: {
          ...state.reanaToken,
          value: action.reana_token?.value,
          status: action.reana_token?.status,
          requestedAt: action.reana_token?.requested_at,
        },
        loadingUser: false,
      };
    case USER_FETCH_ERROR:
      const { type, ...errorData } = action;
      return {
        ...state,
        error: {
          [USER_ERROR.fetch]: errorData,
        },
        loadingUser: false,
      };
    case USER_SIGNEDOUT:
      return authInitialState;
    case USER_SIGN_ERROR:
      return {
        ...state,
        error: {
          [USER_ERROR.sign]: action.errors,
        },
      };
    case USER_REQUEST_TOKEN:
      return { ...state, reanaToken: { ...state.reanaToken, loading: true } };
    case USER_TOKEN_REQUESTED:
      return {
        ...state,
        reanaToken: {
          ...state.reanaToken,
          status: action.reana_token?.status,
          requestedAt: action.reana_token?.requested_at,
          loading: false,
        },
      };
    case USER_TOKEN_ERROR:
      return {
        ...state,
        reanaToken: {
          ...state.reanaToken,
          loading: false,
        },
      };
    default:
      return state;
  }
};

const workflows = (state = workflowsInitialState, action) => {
  switch (action.type) {
    case WORKFLOWS_FETCH:
      return { ...state, loadingWorkflows: true };
    case WORKFLOWS_RECEIVED:
      return {
        ...state,
        workflows: action.workflows,
        workflowsFetched: true,
        total: action.total,
        userHasWorkflows: action.userHasWorkflows,
        loadingWorkflows: false,
      };
    case WORKFLOWS_FETCH_ERROR:
      return { ...state, loadingWorkflows: false };
    case OPEN_DELETE_WORKFLOW_MODAL:
      return {
        ...state,
        workflowDeleteModal: { open: true, workflow: action.workflow },
      };
    case CLOSE_DELETE_WORKFLOW_MODAL:
      return { ...state, workflowDeleteModal: { open: false, workflow: null } };
    case OPEN_STOP_WORKFLOW_MODAL:
      return {
        ...state,
        workflowStopModal: { open: true, workflow: action.workflow },
      };
    case CLOSE_STOP_WORKFLOW_MODAL:
      return { ...state, workflowStopModal: { open: false, workflow: null } };
    case WORKFLOW_LIST_REFRESH:
      return { ...state, workflowRefresh: Math.random() };

    default:
      return state;
  }
};

const details = (state = detailsInitialState, action) => {
  switch (action.type) {
    case WORKFLOW_LOGS_FETCH:
      return { ...state, loadingDetails: true };
    case WORKFLOW_LOGS_RECEIVED:
      return {
        ...state,
        details: {
          ...state.details,
          [action.id]: { ...state.details[action.id], logs: action.logs },
        },
        loadingDetails: false,
      };
    case WORKFLOW_FILES_FETCH:
      return { ...state, loadingDetails: true };
    case WORKFLOW_FILES_RECEIVED:
      return {
        ...state,
        details: {
          ...state.details,
          [action.id]: {
            ...state.details[action.id],
            files: { items: action.files, total: action.total },
          },
        },
        loadingDetails: false,
      };
    case WORKFLOW_SPECIFICATION_FETCH:
      return { ...state, loadingDetails: true };
    case WORKFLOW_SPECIFICATION_RECEIVED:
      return {
        ...state,
        details: {
          ...state.details,
          [action.id]: {
            ...state.details[action.id],
            specification: action.specification,
            parameters: action.parameters,
          },
        },
        loadingDetails: false,
      };
    case WORKFLOW_RETENTION_RULES_RECEIVED:
      return {
        ...state,
        details: {
          ...state.details,
          [action.id]: {
            ...state.details[action.id],
            retentionRules: action.retentionRules,
          },
        },
      };
    default:
      return state;
  }
};

const quota = (state = quotaInitialState, action) => {
  switch (action.type) {
    case QUOTA_FETCH:
      return { ...state, loading: action.loader };
    case QUOTA_RECEIVED:
      return { ...state, loading: false, ...action.quota };
    case QUOTA_FETCH_ERROR:
      return { ...state, loading: false };
    default:
      return state;
  }
};

const sharing = (state = sharingInitialState, action) => {
  switch (action.type) {
    case USERS_SHARED_WITH_YOU_FETCH:
      return { ...state };
    case USERS_SHARED_WITH_YOU_RECEIVED:
      return {
        ...state,
        usersSharedWithYou: action.users_shared_with_you,
      };
    case USERS_SHARED_WITH_YOU_FETCH_ERROR:
      return { ...state, loading: false };
    case USERS_YOU_SHARED_WITH_FETCH:
      return {
        ...state,
      };
    case USERS_YOU_SHARED_WITH_RECEIVED:
      return {
        ...state,
        usersYouSharedWith: action.users_you_shared_with,
      };
    case USERS_YOU_SHARED_WITH_FETCH_ERROR:
      return { ...state, loading: false };
    default:
      return state;
  }
};

const reanaApp = combineReducers({
  notification,
  config,
  auth,
  workflows,
  details,
  quota,
  sharing,
});

export default reanaApp;
