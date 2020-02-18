/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { useSelector } from "react-redux";
import { Container, Header, Icon } from "semantic-ui-react";

import { getReanaToken } from "../../../selectors";
import { CodeSnippet } from "../../../components";
import config from "../../../config";

import styles from "./NoWorkflows.module.scss";

export default function NoWorkflows() {
  const reanaToken = useSelector(getReanaToken);

  return (
    <Container text className={styles["container"]}>
      <Header as="h2" dividing className={styles["header"]}>
        Welcome to REANA!
      </Header>
      <div>
        <p>
          It seems that you are using REANA for the first time. Would you like
          to try out a small example? Please login to LXPLUS and launch:
        </p>
        <CodeSnippet>
          <div>ssh lxplus.cern.ch</div>
          <div>source ~simko/public/reana/bin/activate</div>
          <div>export REANA_SERVER_URL={config.api}</div>
          <div>export REANA_ACCESS_TOKEN={reanaToken}</div>
          <div>
            git clone https://github.com/reanahub/reana-demo-root6-roofit
          </div>
          <div>cd reana-demo-root6-roofit</div>
          <div>reana-client run -w root6-roofit</div>
        </CodeSnippet>
        <p>and come back to this web page once launched!</p>
        <p>
          For more information about REANA, please see{" "}
          <a href={config.docsURL}>docs.reana.io</a>
        </p>
        <p>
          You can contact us at{" "}
          <a href={config.mattermostURL}>REANA Mattermost channel</a>.
        </p>
        <p>
          Thanks for flying REANA! <Icon name="rocket" />
        </p>
      </div>
    </Container>
  );
}
