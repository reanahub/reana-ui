/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEmpty from "lodash/isEmpty";
import { Loader } from "semantic-ui-react";

import { useGetWorkflowSpecification } from "~/api/hooks";
import { CodeSnippet, Title } from "~/components";

import styles from "./WorkflowSpecification.module.scss";

interface WorkflowSpecificationProps {
  id: string;
}

export default function WorkflowSpecification({
  id,
}: WorkflowSpecificationProps) {
  const { data: specData, isLoading: loading } =
    useGetWorkflowSpecification(id);
  const specification = specData?.specification;
  const runtimeParams = specData?.parameters;

  return loading ? (
    <Loader active inline="centered" />
  ) : (
    <>
      {!isEmpty(runtimeParams) && (
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
