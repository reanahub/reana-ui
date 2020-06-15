/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

const config = {
  name: "CERN REANA UI",
  api: window.location.origin,
  poolingSecs: 15,
  docsURL: "http://docs.reana.io/",
  forumURL: "https://forum.reana.io/",
  mattermostURL: "https://mattermost.web.cern.ch/it-dep/channels/reana",
  // TODO: Move to reana-server config
  sso: true,
  localUsers: true
};

export default config;
