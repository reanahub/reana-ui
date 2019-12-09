/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

export const isLoggedIn = state => !!state.auth.email;
export const getUserEmail = state => state.auth.email;
export const getUserFullName = state => state.auth.fullName;
export const loadingUser = state => state.auth.loadingUser;
export const getReanaToken = state => state.auth.reanaToken;
