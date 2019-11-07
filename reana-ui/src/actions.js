/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import config from "./config";

export const USER_RECEIVED = "User logged in";

const USER_INFO_URL = config.api + "/api/me";

export function loadUser() {
  return async dispatch => {
    let resp, data;

    try {
      // TODO: Extract fetching logic to a different file
      resp = await fetch(USER_INFO_URL, { credentials: "include" });
    } catch (err) {
      throw new Error(USER_INFO_URL, 0, err);
    }
    if (resp.status === 401) {
      console.log("User must be logged in");
    } else if (resp.ok) {
      data = await resp.json();
    }
    dispatch({ type: USER_RECEIVED, ...data });
    return resp;
  };
}
