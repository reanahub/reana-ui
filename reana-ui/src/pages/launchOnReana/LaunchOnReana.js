/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, Container, Icon, Image, Loader } from "semantic-ui-react";

import BasePage from "../BasePage";
import Welcome from "./Welcome";
import { Box, CodeSnippet, Title } from "~/components";
import {
  clearNotification,
  errorActionCreator,
  triggerNotification,
} from "~/actions";
import client from "~/client";
import { useQuery } from "~/hooks";
import {
  LAUNCH_ON_REANA_PARAMS_WHITELIST,
  LAUNCH_ON_REANA_BADGE_URL,
} from "~/config";

import styles from "./LaunchOnReana.module.scss";

export const DEFAULT_WORKFLOW_NAME = "workflow";
export const DEFAULT_SPEC_FILENAME = "reana.yaml";

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
        dispatch(clearNotification);
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
   * Check if the search query string includes all the required parameters.
   * @param {URLSearchParams} query Search query string.
   * @returns {boolean} Whether the search query string includes all the required parameters.
   */
  function isMissingRequiredParams(query) {
    const requiredParams = getRequiredQsParams();
    const qsKeys = [...query.keys()];
    return !requiredParams.every((param) => qsKeys.includes(param));
  }

  /**
   * Memoised function to get workflow parameters.
   * Since this function is called twice and its return value should not
   * change unless the query string parameters change, memoising it improves
   * performace, avoiding extra calls.
   */
  const getWorkflowParameters = useCallback(() => {
    /**
     * Parses workflow parameters. Triggers notification error if invalid.
     * @param {URLSearchParams} query Standard URLSearchParams object.
     * @returns {Object | null} Returns object with workflow parameters or `null` if invalid.
     */
    function fn(query) {
      try {
        return JSON.parse(query.get("parameters"));
      } catch (error) {
        dispatch(
          triggerNotification(
            "An error has occurred",
            `Invalid JSON workflow parameters provided: ${query.get(
              "parameters"
            )}`,
            { error: true }
          )
        );
      }
      return null;
    }
    return fn(query);
  }, [dispatch, query]);

  return (
    <BasePage>
      <Container text className={styles["container"]}>
        <div>
          <Title>Launch on REANA</Title>
        </div>
        {isMissingRequiredParams(query) ? (
          <Welcome />
        ) : (
          <Box className={styles.box} wrap>
            <section className={styles.details}>
              <span className={styles.icon}>
                <Icon name="hourglass half" />
              </span>
              <div>
                <div className={styles.name}>
                  {query.get("name") ?? DEFAULT_WORKFLOW_NAME}
                </div>
                <a className={styles.url} href={query.get("url")}>
                  {query.get("url")}
                </a>
                <div>
                  <Icon name="file code outline" />
                  {query.get("spec") ?? DEFAULT_SPEC_FILENAME}
                </div>
                {query.get("parameters") && getWorkflowParameters() && (
                  <div className={styles.parameters}>
                    Parameters:
                    <ul>
                      {Object.entries(getWorkflowParameters()).map(([k, v]) => (
                        <li key={k}>
                          {k}: {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
            <section className={styles.actions}>
              <Button
                primary
                icon="rocket"
                content="Launch"
                onClick={handleLaunch}
                disabled={loading || isMissingRequiredParams(query)}
              />
            </section>
            {/* FIXME: Hide the badge markdown snippet temporarily until implementing R/W */}
            {/* <BadgeEmbed /> */}
          </Box>
        )}
        {loading && <Loader content="Executing workflow..." />}
      </Container>
    </BasePage>
  );
}

const BadgeEmbed = () => (
  <details className={styles.badge}>
    <summary>
      Expand to see the text below, paste it into your README to show a REANA
      badge:{" "}
      <Image src={LAUNCH_ON_REANA_BADGE_URL} href={window.location.href} />
    </summary>
    <CodeSnippet dollarPrefix={false} copy>
      <div>
        [![Launch on REANA]({LAUNCH_ON_REANA_BADGE_URL})]($
        {window.location.href})
      </div>
    </CodeSnippet>
  </details>
);
