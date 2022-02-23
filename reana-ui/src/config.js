/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

export const api = process.env.REACT_APP_SERVER_URL || window.location.origin;

/**
 * Valid Launch-on-REANA querystring parameter keys.
 */
export const LAUNCH_ON_REANA_PARAMS_WHITELIST = ["url", "name", "parameters"];
