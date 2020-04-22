/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

// Auth
export const isLoggedIn = state => !!state.auth.email;
export const getUserEmail = state => state.auth.email;
export const getUserFullName = state => state.auth.fullName;
export const loadingUser = state => state.auth.loadingUser;
export const getReanaToken = state => state.auth.reanaToken;
export const hasRequestedToken = state => state.auth.tokenRequested;

// Workflows
export const loadingWorkflows = state => state.workflows.loadingWorkflows;
export const getWorkflows = state => state.workflows.workflows;
export const getWorkflow = id => state =>
  state.workflows.workflows && state.workflows.workflows[id];

// Details
export const loadingDetails = state => state.details.loadingDetails;
export const getWorkflowLogs = id => state =>
  (id in state.details.details && state.details.details[id].logs) || {};
export const getWorkflowFiles = id => state =>
  id in state.details.details && state.details.details[id].files;
export const getWorkflowSpecification = id => state =>
  id in state.details.details && state.details.details[id].specification;
export const getWorkflowParameters = id => state =>
  id in state.details.details && state.details.details[id].parameters;
