/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import PropTypes from "prop-types";
import { Progress } from "semantic-ui-react";

import { statusMapping } from "../../../util";

export default function WorkflowProgress({ workflow }) {
  function handlePercentage(completedSteps, totalSteps) {
    return Math.floor((completedSteps * 100) / totalSteps);
  }

  return (
    <Progress
      size="small"
      percent={handlePercentage(workflow.completed, workflow.total)}
      color={statusMapping[workflow.status].color}
      active={workflow.status === "running"}
    />
  );
}

WorkflowProgress.propTypes = {
  workflow: PropTypes.object.isRequired
};
