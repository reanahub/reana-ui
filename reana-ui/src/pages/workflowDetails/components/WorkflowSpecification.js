/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import { fetchWorkflowSpecification } from "../../../actions";
import {
  getWorkflowSpecification,
  loadingDetails,
  getWorkflowParameters
} from "../../../selectors";
import { CodeSnippet, Title } from "../../../components";

import styles from "./WorkflowSpecification.module.scss";

export default function WorkflowSpecification({ id }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const specification = useSelector(getWorkflowSpecification(id));
  const runtimeParams = useSelector(getWorkflowParameters(id));

  useEffect(() => {
    dispatch(fetchWorkflowSpecification(id));
  }, [dispatch, id]);

  return loading ? (
    <Loader active inline="centered" />
  ) : (
    <>
      {!_.isEmpty(runtimeParams) && (
        <>
          <Title as="h4">Runtime parameters</Title>
          <CodeSnippet>{JSON.stringify(runtimeParams, null, 2)}</CodeSnippet>
          <Title as="h4">REANA specification</Title>
        </>
      )}
      <CodeSnippet classes={styles.spec}>
        {JSON.stringify(specification, null, 2)}
      </CodeSnippet>
    </>
  );
}
