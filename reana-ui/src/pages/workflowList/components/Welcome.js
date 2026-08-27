/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { Container, Icon } from "semantic-ui-react";
import PropTypes from "prop-types";

import { getConfig } from "~/selectors";
import { CodeSnippet, Title } from "~/components";
import { api } from "~/config";

import styles from "./Welcome.module.scss";

export default function Welcome() {
  return (
    <Container text className={styles["container"]}>
      <Title as="h2">Welcome to REANA!</Title>
      <WelcomeMsg />
    </Container>
  );
}

function WelcomeMsg() {
  const config = useSelector(getConfig);
  return (
    <div>
      <WelcomeRegular loginRequired={Boolean(config.auth?.bff_enabled)} />
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

function WelcomeRegular({ loginRequired }) {
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
        {loginRequired && (
          <>
            <div># authenticate with the REANA server</div>
            <div>reana-client login</div>
          </>
        )}
        <div># clone and run a simple analysis example</div>
        <div>git clone https://github.com/reanahub/reana-demo-root6-roofit</div>
        <div>cd reana-demo-root6-roofit</div>
        <div>reana-client run -w root6-roofit</div>
      </CodeSnippet>
    </>
  );
}

WelcomeRegular.propTypes = {
  loginRequired: PropTypes.bool.isRequired,
};

function WelcomeEnvars() {
  return (
    <>
      <div>export REANA_SERVER_URL={api}</div>
    </>
  );
}
