/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState, useMemo } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import { getReanaToken } from "~/selectors";

import styles from "./LaunchOnReana.module.scss";

export const DEFAULT_WORKFLOW_NAME = "workflow";
export const DEFAULT_SPEC_FILENAME = "reana.yaml";

export default function LaunchOnReana() {
  const reanaToken = useSelector(getReanaToken);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const query = useQuery();
  filterParams(query);
  const dispatch = useDispatch();

  function handleLaunch() {
    setLoading(true);
    client
      .launchWorkflow(Object.fromEntries(query))
      .then(
        ({
          data: { workflow_id: workflowId, message, validation_warnings },
        }) => {
          if (validation_warnings) {
            let warningMessages = [];
            // Iterate over all keys in validation_warning
            for (const key in validation_warnings) {
              if (key === "additional_properties") {
                const properties = validation_warnings[key].join(", ");
                warningMessages.push(
                  `Unexpected properties found in the REANA specification: ${properties}.`,
                );
              } else {
                // For other keys, we simply display the key and its value.
                warningMessages.push(`${key}: ${validation_warnings[key]}`);
              }
            }

            warningMessages.forEach((warning) => {
              message += ` ${warning}`;
            });
            dispatch(
              triggerNotification("Workflow submitted with warnings", message, {
                warning: true,
              }),
            );
          } else {
            dispatch(triggerNotification("Workflow submitted", message));
          }
          history.push(`/details/${workflowId}`);
        },
      )
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
   * Memoised variable containing workflow parameters.
   * Since this variable is used twice and its value should not
   * change unless the query string parameters change, memoising
   * it improves performace, avoiding extra calls.
   */
  const workflowParameters = useMemo(() => {
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
              "parameters",
            )}`,
            { error: true },
          ),
        );
        query.delete("parameters");
      }
      return null;
    }
    return fn(query);
  }, [dispatch, query]);

  if (!reanaToken) {
    return <Redirect to="/" />;
  }

  const pageTitle =
    "Launch on REANA" + (query.get("name") ? `: ${query.get("name")}` : "");

  return (
    <BasePage title={pageTitle}>
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
                <a
                  className={styles.url}
                  href={query.get("url")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {query.get("url")}
                </a>
                <div>
                  <Icon name="file code outline" />
                  {query.get("specification") ?? DEFAULT_SPEC_FILENAME}
                </div>
                {query.get("parameters") && workflowParameters && (
                  <div className={styles.parameters}>
                    <Icon name="sliders horizontal" />
                    Parameters:
                    <ul>
                      {Object.entries(workflowParameters).map(([k, v]) => (
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
        <Loader active={loading} content="Executing workflow..." />
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
