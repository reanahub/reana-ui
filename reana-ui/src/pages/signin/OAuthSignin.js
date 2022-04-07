/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Redirect } from "react-router-dom";
import { useDispatch } from "react-redux";

import { triggerNotification } from "~/actions";
import { useQuery } from "~/hooks";

export default function OAuthSignin() {
  const dispatch = useDispatch();
  const query = useQuery();
  const queryParams = Object.fromEntries(query.entries());

  if ("code" in queryParams && queryParams.code !== "200") {
    dispatch(
      triggerNotification("Authentication error", queryParams.message, {
        error: true,
      })
    );
  }

  if ("next_url" in queryParams) {
    return <Redirect to={queryParams.next_url} />;
  }

  return <Redirect to="/" />;
}
