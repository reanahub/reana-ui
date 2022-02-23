/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, Container, Loader } from "semantic-ui-react";

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

  function filterParams(query) {
    for (const qsParamsKey of query.keys()) {
      if (!LAUNCH_ON_REANA_PARAMS_WHITELIST.includes(qsParamsKey)) {
        query.delete(qsParamsKey);
      }
    }
  }

  return (
    <BasePage>
      <Container text className={styles["container"]}>
        <div>
          <Title>Launch on REANA</Title>
        </div>
        <ul>
          {[...query].map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
        </ul>
        <Button
          primary
          icon="rocket"
          content="Launch"
          onClick={handleLaunch}
          disabled={loading}
        />
        <Loader active={loading} content="Executing workflow..." />
      </Container>
    </BasePage>
  );
}
