/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";

export const workflowShape = PropTypes.shape({
  id: PropTypes.string,
  created: PropTypes.string,
  name: PropTypes.string,
  progress: PropTypes.object,
  size: PropTypes.shape({
    raw: PropTypes.number,
    human_readable: PropTypes.string,
  }),
  status: PropTypes.string,
  user: PropTypes.string,
  run: PropTypes.string,
  completed: PropTypes.number,
  total: PropTypes.number,
  createdDate: PropTypes.string,
  startedDate: PropTypes.string,
  finishedDate: PropTypes.string,
  friendlyCreated: PropTypes.string,
  friendlyStarted: PropTypes.string,
  friendlyFinished: PropTypes.string,
  duration: PropTypes.string,
});
