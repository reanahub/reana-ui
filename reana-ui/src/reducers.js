/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 CERN.

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
  QUOTA_FETCH,
  QUOTA_RECEIVED,
  QUOTA_FETCH_ERROR,
  GITLAB_WEBHOOK_TOKEN_FETCH,
  GITLAB_WEBHOOK_TOKEN_RECEIVED,
  GITLAB_WEBHOOK_TOKEN_UPDATED,
  GITLAB_WEBHOOK_TOKEN_FETCH_ERROR,
  WORKFLOWS_FETCH,
  WORKFLOWS_RECEIVED,
  WORKFLOWS_FETCH_ERROR,
  WORKFLOW_LIST_REFRESH,
  WORKFLOW_LOGS_FETCH,
  WORKFLOW_LOGS_RECEIVED,
  WORKFLOW_SPECIFICATION_FETCH,
  WORKFLOW_SPECIFICATION_RECEIVED,
  WORKFLOW_FILES_FETCH,
  WORKFLOW_FILES_FETCH_ERROR,
  WORKFLOW_FILES_RECEIVED,
  WORKFLOW_RETENTION_RULES_RECEIVED,
  OPEN_DELETE_WORKFLOW_MODAL,
  CLOSE_DELETE_WORKFLOW_MODAL,
  OPEN_PRUNE_WORKFLOW_MODAL,
  CLOSE_PRUNE_WORKFLOW_MODAL,
  OPEN_INTERACTIVE_SESSION_MODAL,
  CLOSE_INTERACTIVE_SESSION_MODAL,
  OPEN_STOP_WORKFLOW_MODAL,
  CLOSE_STOP_WORKFLOW_MODAL,
  WARNING,
  USERS_SHARED_WITH_YOU_RECEIVED,
  USERS_YOU_SHARED_WITH_RECEIVED,
  OPEN_SHARE_WORKFLOW_MODAL,
  CLOSE_SHARE_WORKFLOW_MODAL,
  WORKFLOW_SHARE_STATUS_FETCH,
  WORKFLOW_SHARE_STATUS_RECEIVED,
  WORKFLOW_SHARE_STATUS_FETCH_ERROR,
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
  privacyNoticeURL: null,
  auth: {},
  adminEmail: null,
  maxInteractiveSessionInactivityPeriod: null,
  isLoaded: false,
  loading: false,
  filePreviewSizeLimit: null,
  launcherExamples: [],
  interactiveSessions: null,
};

const authInitialState = {
  id: null,
  email: null,
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
  workflowPruneModal: { open: false, workflow: null },
  workflowStopModal: { open: false, workflow: null },
  interactiveSessionModal: { open: false, workflow: null },
  workflowShareModal: { open: false, workflow: null },
  workflowRefresh: null,
  loadingWorkflowShareStatus: false,
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
  loadingWorkflowShare: false,
  loadingWorkflowUnshare: false,
  usersWorkflowWasSharedWith: [],
  usersWorkflowWasNotSharedWith: [],
  userWorkflowWasUnsharedWith: null,
  sharedWith: {},
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
  const parseInteractiveSessions = (interactiveSessions) => {
    const environments = interactiveSessions?.environments ?? {};
    const parsedEnvironments = {};
    for (const sessionType in environments) {
      parsedEnvironments[sessionType] = {
        allowCustom: environments[sessionType]?.allow_custom ?? false,
        recommended: environments[sessionType]?.recommended ?? [],
      };
    }
    return { ...interactiveSessions, environments: parsedEnvironments };
  };

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
        privacyNoticeURL: action.privacy_notice_url,
        auth: action.auth ?? {},
        adminEmail: action.admin_email,
        maxInteractiveSessionInactivityPeriod:
          action.maximum_interactive_session_inactivity_period,
        quotaEnabled: action.quota_enabled,
        filePreviewSizeLimit: action.file_preview_size_limit,
        launcherExamples: action.launcher_examples,
        interactiveSessions: parseInteractiveSessions(
          action.interactive_sessions,
        ),
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
      // Clear any error left by a previous attempt so a retry (whether
      // triggered by the user or a background refresh) isn't permanently
      // shadowed by a stale failure.
      return { ...state, loadingUser: action.loader, error: {} };
    case USER_RECEIVED:
      return {
        ...state,
        id: action.id ?? action.id_,
        email: action.email,
        fullName: action.full_name,
        username: action.username,
        loadingUser: false,
        error: {},
      };
    case USER_FETCH_ERROR: {
      const { type, loader, ...errorData } = action;
      const isAccessNotGranted =
        errorData.status === 403 && errorData.code === "access_not_granted";
      if (!loader && !isAccessNotGranted) {
        // A background refresh's transient failure (e.g. Profile's
        // non-disruptive re-fetch hitting a 503) must not block the whole
        // app behind App's error gate -- it's already surfaced via the
        // notification dispatched alongside this action. Only a foreground
        // (initial-load) failure does that. access_not_granted is exempted
        // from this: a role revoked mid-session is a real, actionable state
        // (App.js routes it to the dedicated AccessNotGranted screen, not
        // the generic error gate) and must surface however it's discovered,
        // not just on the very first load.
        return { ...state, loadingUser: false };
      }
      return {
        ...state,
        error: {
          [USER_ERROR.fetch]: errorData,
        },
        loadingUser: false,
      };
    }
    case USER_SIGNEDOUT:
      return authInitialState;
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
    case OPEN_PRUNE_WORKFLOW_MODAL:
      return {
        ...state,
        workflowPruneModal: { open: true, workflow: action.workflow },
      };
    case CLOSE_PRUNE_WORKFLOW_MODAL:
      return { ...state, workflowPruneModal: { open: false, workflow: null } };
    case OPEN_STOP_WORKFLOW_MODAL:
      return {
        ...state,
        workflowStopModal: { open: true, workflow: action.workflow },
      };
    case CLOSE_STOP_WORKFLOW_MODAL:
      return { ...state, workflowStopModal: { open: false, workflow: null } };
    case OPEN_INTERACTIVE_SESSION_MODAL:
      return {
        ...state,
        interactiveSessionModal: { open: true, workflow: action.workflow },
      };
    case CLOSE_INTERACTIVE_SESSION_MODAL:
      return {
        ...state,
        interactiveSessionModal: { open: false, workflow: null },
      };
    case OPEN_SHARE_WORKFLOW_MODAL:
      return {
        ...state,
        workflowShareModal: { open: true, workflow: action.workflow },
      };
    case CLOSE_SHARE_WORKFLOW_MODAL:
      return { ...state, workflowShareModal: { open: false, workflow: null } };
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
    case WORKFLOW_FILES_FETCH_ERROR:
      return { ...state, loadingDetails: false };
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
      return state;
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

const gitlabWebhookTokenInitialState = {
  phase: "idle",
  status: null,
  retryAt: null,
  activeRequestId: null,
};

// A single shared status object, kept in sync by every component that
// fetches or renews it (GitLabProjects's profile-page view, and the global
// WebhookExpiryWarning banner), so a renewal made from one place is
// immediately reflected in the other without a separate refetch.
//
// The request phase is shared as well as the value: WebhookExpiryWarning is
// remounted on every page navigation, so a component-local loading flag would
// permit a second request while the first one is still in flight. Errors keep
// one absolute retry deadline, preventing remounts from postponing or
// accelerating the bounded retry.
const gitlabWebhookToken = (state = gitlabWebhookTokenInitialState, action) => {
  switch (action.type) {
    case GITLAB_WEBHOOK_TOKEN_FETCH:
      return {
        ...state,
        phase: "loading",
        retryAt: null,
        activeRequestId: action.requestId,
      };
    case GITLAB_WEBHOOK_TOKEN_RECEIVED:
      if (
        action.requestId !== undefined &&
        action.requestId !== state.activeRequestId
      ) {
        return state;
      }
      return {
        phase: "ready",
        status: action.status,
        retryAt: null,
        activeRequestId: null,
      };
    case GITLAB_WEBHOOK_TOKEN_UPDATED:
      return {
        phase: "ready",
        status: action.status,
        retryAt: null,
        activeRequestId: null,
      };
    case GITLAB_WEBHOOK_TOKEN_FETCH_ERROR:
      if (action.requestId !== state.activeRequestId) return state;
      return {
        ...state,
        phase: action.retryAt === null ? "error" : "retry_wait",
        retryAt: action.retryAt,
        activeRequestId: null,
      };
    case USER_SIGNEDOUT:
      return gitlabWebhookTokenInitialState;
    default:
      return state;
  }
};

const sharing = (state = sharingInitialState, action) => {
  switch (action.type) {
    case USERS_SHARED_WITH_YOU_RECEIVED:
      return {
        ...state,
        usersSharedWithYou: action.usersSharedYouWith,
      };
    case USERS_YOU_SHARED_WITH_RECEIVED:
      return {
        ...state,
        usersYouSharedWith: action.usersYouSharedWith,
      };
    case WORKFLOW_SHARE_STATUS_FETCH:
      return { ...state, loadingWorkflowShareStatus: true };
    case WORKFLOW_SHARE_STATUS_RECEIVED:
      return {
        ...state,
        sharedWith: {
          ...state.sharedWith,
          [action.id]: {
            ...state.sharedWith[action.id],
            sharedWith: action.sharedWith,
          },
        },
        loadingWorkflowShareStatus: false,
      };
    case WORKFLOW_SHARE_STATUS_FETCH_ERROR:
      return { ...state, loadingWorkflowShareStatus: false };

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
  gitlabWebhookToken,
});

export default reanaApp;
