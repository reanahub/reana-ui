/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { Button, Container, Icon } from "semantic-ui-react";

import { requestToken } from "../../../actions";
import {
  getConfig,
  getReanaToken,
  getReanaTokenStatus,
  getReanaTokenRequestedAt,
  loadingTokenStatus,
} from "../../../selectors";
import { CodeSnippet, Title } from "../../../components";
import { api } from "../../../config";

import styles from "./Welcome.module.scss";

export default function Welcome() {
  const reanaToken = useSelector(getReanaToken);
  return (
    <Container text className={styles["container"]}>
      <Title as="h2">Welcome to REANA!</Title>
      {reanaToken ? <WelcomeMsg /> : <WelcomeNoTokenMsg />}
    </Container>
  );
}

function WelcomeMsg() {
  const config = useSelector(getConfig);
  return (
    <div>
      {config.cernSSO ? <WelcomeCERN /> : <WelcomeRegular />}
      <p>and come back to this web page once launched!</p>
      <p>
        For more information about REANA, please see{" "}
        <a href={config.docsURL}>docs.reana.io</a>
      </p>
      {config.chatURL && (
        <p>
          You can contact us at{" "}
          <a href={config.chatURL}>REANA Mattermost channel</a>.
        </p>
      )}
      <p>
        Thanks for flying REANA! <Icon name="rocket" />
      </p>
    </div>
  );
}

function WelcomeRegular() {
  return (
    <>
      <p>
        It seems that you are using REANA for the first time. Would you like to
        try out a small example? Please proceed as follows:
      </p>
      <CodeSnippet reveal>
        <div># create new virtual environment</div>
        <div>virtualenv ~/.virtualenvs/reana</div>
        <div>source ~/.virtualenvs/reana/bin/activate</div>
        <div># install reana-client</div>
        <div>pip install reana-client</div>
        <div># set REANA environment variables for the client</div>
        <WelcomeEnvars />
        <div># clone and run a simple analysis example</div>
        <div>git clone https://github.com/reanahub/reana-demo-root6-roofit</div>
        <div>cd reana-demo-root6-roofit</div>
        <div>reana-client run -w root6-roofit</div>
      </CodeSnippet>
    </>
  );
}

function WelcomeCERN() {
  const config = useSelector(getConfig);
  return (
    <>
      <p>
        It seems that you are using REANA for the first time. Would you like to
        try out a small example? Please login to LXPLUS and launch:
      </p>
      <CodeSnippet reveal>
        <div>ssh lxplus.cern.ch</div>
        <div>source {config.clientPyvenv}</div>
        <WelcomeEnvars />
        <div>git clone https://github.com/reanahub/reana-demo-root6-roofit</div>
        <div>cd reana-demo-root6-roofit</div>
        <div>reana-client run -w root6-roofit</div>
      </CodeSnippet>
    </>
  );
}

function WelcomeEnvars() {
  const reanaToken = useSelector(getReanaToken);
  return (
    <>
      <div>export REANA_SERVER_URL={api}</div>
      <div>
        export REANA_ACCESS_TOKEN=
        <span className="revealable">{reanaToken}</span>
      </div>
    </>
  );
}

export function WelcomeNoTokenMsg() {
  const tokenStatus = useSelector(getReanaTokenStatus);
  const tokenRequestedAt = useSelector(getReanaTokenRequestedAt);
  const loading = useSelector(loadingTokenStatus);
  const dispatch = useDispatch();

  const handleRequestToken = () => dispatch(requestToken());

  return tokenStatus === "requested" ? (
    <div>
      <p>
        Your access token request has been forwarded to REANA administrators.
      </p>
      <Button content="Token requested" disabled />
      <small className={styles.requested}>
        <em>
          {moment.utc(tokenRequestedAt).format("YYYY-MM-DDThh:mm:ss")}
        </em>
      </small>
    </div>
  ) : (
    <div>
      <p>
        It seems that this is your first login to REANA. In order to use the
        system, you need to ask for an access token.
      </p>
      <Button
        content="Request token"
        onClick={handleRequestToken}
        loading={loading}
      />
    </div>
  );
}
