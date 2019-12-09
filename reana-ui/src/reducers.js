/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { combineReducers } from "redux";
import { USER_FETCH, USER_RECEIVED, USER_LOGOUT } from "./actions";

const initialState = {
  email: null,
  reanaToken: null,
  loadingUser: false
};

const auth = (state = initialState, action) => {
  switch (action.type) {
    case USER_FETCH:
      return { ...state, loadingUser: true };
    case USER_RECEIVED:
      return {
        ...state,
        email: action.email,
        fullName: action.full_name,
        username: action.username,
        reanaToken: action.reana_token,
        loadingUser: false
      };
    case USER_LOGOUT:
      return initialState;
    default:
      return state;
  }
};

const reanaApp = combineReducers({
  auth
});

export default reanaApp;
