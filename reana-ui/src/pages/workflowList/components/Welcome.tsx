/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Container, Icon } from "semantic-ui-react";

import { useGetYou, useGetConfig } from "~/api/hooks";
import client from "~/client";
import { CodeSnippet, Title } from "~/components";
import { api } from "~/config";

import styles from "./Welcome.module.scss";

export default function Welcome() {
  const { data: youData } = useGetYou();
  const reanaToken = youData?.reana_token?.value;
  return (
    <Container text className={styles["container"]}>
      <Title as="h2">Welcome to REANA!</Title>
      {reanaToken ? <WelcomeMsg /> : <WelcomeNoTokenMsg />}
    </Container>
  );
}

function WelcomeMsg() {
  const config = useGetConfig().data ?? ({} as any);
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
  const config = useGetConfig().data ?? ({} as any);
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
  const { data: youData } = useGetYou();
  const reanaToken = youData?.reana_token?.value;
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
  const queryClient = useQueryClient();
  const { data: youData, isLoading } = useGetYou();
  const tokenStatus = youData?.reana_token?.status;
  const tokenRequestedAt = youData?.reana_token?.requested_at;

  const handleRequestToken = async () => {
    await client.requestToken().catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["/api/you"] });
  };

  return tokenStatus === "requested" ? (
    <div>
      <p>
        Your access token request has been forwarded to REANA administrators.
      </p>
      <Button content="Token requested" disabled />
      <small className={styles.requested}>
        <em>{moment.utc(tokenRequestedAt).format("YYYY-MM-DDTHH:mm:ss")}</em>
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
        loading={isLoading}
      />
    </div>
  );
}
