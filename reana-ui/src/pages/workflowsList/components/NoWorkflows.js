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
import CodeSnippet from "../../../components/CodeSnippet";
import config from "../../../config";

import styles from "./NoWorkflows.module.scss";

export default function NoWorkflows() {
  const reanaToken = useSelector(getReanaToken);

  return (
    <Container text className={styles["container"]}>
      <Header as="h2">
        It seems that you are using REANA for the first time!
      </Header>
      <div>
        <p>
          Would you like to try out a small example? Please login to LXPLUS and
          launch:
        </p>
        <CodeSnippet light small>
          {`ssh lxplus.cern.ch\n` +
            `source ~simko/public/reana/bin/activate\n` +
            `export REANA_SERVER_URL=https://reana.cern.ch\n` +
            `export REANA_ACCESS_TOKEN=${reanaToken}\n` +
            `git clone https://github.com/reanahub/reana-demo-root6-roofit\n` +
            `cd reana-demo-root6-roofit\n` +
            `reana-client run -w root6-roofit`}
        </CodeSnippet>
        <p>and come back to this web page once launched!</p>
        <p>
          For more information about REANA, please see{" "}
          <a href={config.docs_url}>docs.reana.io</a>
        </p>
        <p>
          You can contact us at{" "}
          <a href={config.mattermost_url}>reana mattermost channel</a>.
        </p>
        <p>
          Thanks for flying REANA! <Icon name="rocket" />
        </p>
      </div>
    </Container>
  );
}
