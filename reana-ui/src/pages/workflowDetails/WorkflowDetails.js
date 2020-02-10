/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";

import BasePage from "../BasePage";
import WorkflowHeader from "./components/WorkflowHeader";
import WorkflowSpace from "./components/WorkflowSpace";
import { useParams } from "react-router-dom";

export default function WorkflowDetailsPage() {
  const { id: workflowId } = useParams();

  return (
    <BasePage>
      <WorkflowHeader />
      <WorkflowSpace id={workflowId} />
    </BasePage>
  );
}
