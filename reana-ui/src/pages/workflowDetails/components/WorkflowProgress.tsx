/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Progress } from "semantic-ui-react";

import { ParsedWorkflow, statusMapping } from "~/util";

interface WorkflowProgressProps {
  workflow: ParsedWorkflow;
}

export default function WorkflowProgress({ workflow }: WorkflowProgressProps) {
  function handlePercentage(
    completedSteps: number,
    totalSteps: number,
    status: string,
  ): number {
    if (status === "finished") return 100;
    return Math.floor((completedSteps * 100) / totalSteps);
  }

  return (
    <Progress
      size="small"
      percent={handlePercentage(
        workflow.completed,
        workflow.total,
        workflow.status,
      )}
      color={statusMapping[workflow.status].color as any}
      active={workflow.status === "running"}
    />
  );
}
