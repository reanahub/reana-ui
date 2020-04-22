/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { useSelector } from "react-redux";
import { Button, Container, Icon } from "semantic-ui-react";

import { getReanaToken, getReanaTokenStatus } from "../../../selectors";
import { CodeSnippet, Title } from "../../../components";
import config from "../../../config";

import styles from "./Welcome.module.scss";

export default function Welcome() {
  const reanaToken = useSelector(getReanaToken);

  const tokenContent = (
    <div>
      <p>
        It seems that you are using REANA for the first time. Would you like to
        try out a small example? Please login to LXPLUS and launch:
      </p>
      <CodeSnippet>
        <div>ssh lxplus.cern.ch</div>
        <div>source /afs/cern.ch/user/r/reana/public/reana/bin/activate</div>
        <div>export REANA_SERVER_URL={config.api}</div>
        <div>export REANA_ACCESS_TOKEN={reanaToken}</div>
        <div>git clone https://github.com/reanahub/reana-demo-root6-roofit</div>
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
  );

  return (
    <Container text className={styles["container"]}>
      <Title as="h2">Welcome to REANA!</Title>
      {reanaToken ? tokenContent : <WelcomeNoTokenMsg />}
    </Container>
  );
}

export function WelcomeNoTokenMsg() {
  const tokenStatus = useSelector(getReanaTokenStatus);

  return tokenStatus === "requested" ? (
    <div>
      <p>
        Your access token request has been forwarded to REANA administrators.
      </p>
      <Button content="Token requested" disabled />
    </div>
  ) : (
    <div>
      <p>
        It seems that this is your first login to REANA. In order to use the
        system, you need to ask for an access token.
      </p>
      <Button content="Request token" />
    </div>
  );
}
