/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, Container, Loader, Message } from "semantic-ui-react";

import BasePage from "../BasePage";
import { Title } from "~/components";
import { errorActionCreator } from "~/actions";
import client from "~/client";
import { useQuery } from "~/hooks";
import { LAUNCH_ON_REANA_PARAMS_WHITELIST } from "~/config";

import styles from "./LaunchOnReana.module.scss";

export default function LaunchOnReana() {
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const query = useQuery();
  filterParams(query);
  const dispatch = useDispatch();

  function handleLaunch() {
    setLoading(true);
    client
      .launchWorkflow(Object.fromEntries(query))
      .then(({ data: { workflow_id: workflowId } }) => {
        history.push(`/details/${workflowId}`);
      })
      .catch((err) => {
        dispatch(errorActionCreator(err));
      })
      .finally(() => setLoading(false));
  }

  /**
   * Filter out parameters not required by Launch on REANA logic.
   * @param {URLSearchParams} query Standard URLSearchParams object.
   */
  function filterParams(query) {
    for (const qsParamsKey of query.keys()) {
      if (
        !Object.keys(LAUNCH_ON_REANA_PARAMS_WHITELIST).includes(qsParamsKey)
      ) {
        query.delete(qsParamsKey);
      }
    }
  }

  /**
   * Filter out non-required Launch on REANA qs params.
   * @returns {Array} List of required qs params.
   */
  function getRequiredQsParams() {
    return Object.entries(LAUNCH_ON_REANA_PARAMS_WHITELIST)
      .filter(([_, { required }]) => required)
      .map(([param, _]) => param);
  }

  /**
   *
   * @param {URLSearchParams} query Search query string.
   * @returns {boolean} Whether the search query string includes all the required parameters.
   */
  function isMissingRequiredParams(query) {
    const requiredParams = getRequiredQsParams();
    const qsKeys = [...query.keys()];
    return !requiredParams.every((param) => qsKeys.includes(param));
  }

  return (
    <BasePage>
      <Container text className={styles["container"]}>
        <div>
          <Title>Launch on REANA</Title>
        </div>
        {isMissingRequiredParams(query) ? (
          <Message
            icon="warning circle"
            header="Missing required query string fields."
            content={`The required fields: ${getRequiredQsParams()}`}
            warning
          />
        ) : (
          <ul>
            {[...query].map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>
        )}
        <Button
          primary
          icon="rocket"
          content="Launch"
          onClick={handleLaunch}
          disabled={loading || isMissingRequiredParams(query)}
        />
        {loading && <Loader content="Executing workflow..." />}
      </Container>
    </BasePage>
  );
}
