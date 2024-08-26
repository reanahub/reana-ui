/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { USER_ERROR } from "./errors";

// Notification
export const getNotification = (state) => state.notification;

// Config
export const getConfig = (state) => state.config;
export const isConfigLoaded = (state) => state.config.isLoaded;
export const isSignupHidden = (state) => state.config.hideSignup;
export const loadingConfig = (state) => state.config.loading;

// Quota
export const getUserQuota = (state) => state.quota;

// Auth
export const isSignedIn = (state) => !!state.auth.email;
export const getUserEmail = (state) => state.auth.email;
export const getUserFullName = (state) => state.auth.fullName;
export const getUserFetchError = (state) => state.auth.error[USER_ERROR.fetch];
export const getUserSignErrors = (state) => state.auth.error[USER_ERROR.sign];
export const loadingUser = (state) => state.auth.loadingUser;
export const getReanaToken = (state) => state.auth.reanaToken.value;
export const getReanaTokenStatus = (state) => state.auth.reanaToken.status;
export const loadingTokenStatus = (state) => state.auth.reanaToken.loading;
export const getReanaTokenRequestedAt = (state) =>
  state.auth.reanaToken.requestedAt;

// Workflows
export const loadingWorkflows = (state) => state.workflows.loadingWorkflows;
export const isWorkflowsFetched = (state) => state.workflows.workflowsFetched;
export const getWorkflows = (state) => state.workflows.workflows;
export const getWorkflowsCount = (state) => state.workflows.total;
export const userHasWorkflows = (state) => state.workflows.userHasWorkflows;
export const getWorkflow = (id) => (state) =>
  state.workflows.workflows && state.workflows.workflows[id];
export const getWorkflowDeleteModalOpen = (state) =>
  state.workflows.workflowDeleteModal.open;
export const getWorkflowDeleteModalItem = (state) =>
  state.workflows.workflowDeleteModal.workflow;
export const getWorkflowStopModalOpen = (state) =>
  state.workflows.workflowStopModal.open;
export const getWorkflowStopModalItem = (state) =>
  state.workflows.workflowStopModal.workflow;
export const getInteractiveSessionModalOpen = (state) =>
  state.workflows.interactiveSessionModal.open;
export const getInteractiveSessionModalItem = (state) =>
  state.workflows.interactiveSessionModal.workflow;
export const getWorkflowShareModalOpen = (state) =>
  state.workflows.workflowShareModal.open;
export const getWorkflowShareModalItem = (state) =>
  state.workflows.workflowShareModal.workflow;
export const getWorkflowRefresh = (state) => state.workflows.workflowRefresh;

// Details
export const loadingDetails = (state) => state.details.loadingDetails;
export const getWorkflowLogs = (id) => (state) =>
  id in state.details.details && state.details.details[id].logs;
export const getWorkflowFiles = (id) => (state) =>
  id in state.details.details && state.details.details[id]?.files?.items;
export const getWorkflowFilesCount = (id) => (state) =>
  id in state.details.details && state.details.details[id]?.files?.total;
export const getWorkflowSpecification = (id) => (state) =>
  id in state.details.details && state.details.details[id].specification;
export const getWorkflowParameters = (id) => (state) =>
  id in state.details.details && state.details.details[id].parameters;
export const getWorkflowRetentionRules = (id) => (state) =>
  id in state.details.details && state.details.details[id].retentionRules;

// Sharing
export const getUsersSharedWithYou = (state) =>
  state.sharing && state.sharing.usersSharedWithYou;
export const getUsersYouSharedWith = (state) =>
  state.sharing && state.sharing.usersYouSharedWith;
export const getLoadingWorkflowShare = (state) =>
  state.sharing && state.sharing.loadingWorkflowShare;
export const getLoadingWorkflowUnshare = (state) =>
  state.sharing && state.sharing.loadingWorkflowUnshare;
export const getUsersWorkflowWasSharedWith = (state) =>
  state.sharing && state.sharing.usersWorkflowWasSharedWith;
export const getUsersWorkflowWasNotSharedWith = (state) =>
  state.sharing && state.sharing.usersWorkflowWasNotSharedWith;
export const getUnshareError = (state) =>
  state.sharing && state.sharing.unshareError;
export const getUserWorkflowWasUnsharedWith = (state) =>
  state.sharing && state.sharing.userWorkflowWasUnsharedWith;
export const getWorkflowShareStatus = (id) => (state) =>
  state.sharing.sharedWith &&
  state.sharing.sharedWith[id] &&
  state.sharing.sharedWith[id].sharedWith;
export const getLoadingWorkflowShareStatus = (state) =>
  state.sharing && state.sharing.loadingWorkflowShareStatus;
