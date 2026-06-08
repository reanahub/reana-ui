/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container } from "semantic-ui-react";

import { useGetYou, useGetConfig, useInfo } from "~/api/hooks";
import BasePage from "../BasePage";
import GitLabProjects from "./components/GitLabProjects";
import Token from "./components/Token";
import Quota from "./components/Quota";
import { Title } from "~/components";

import styles from "./Profile.module.scss";

export default function Profile() {
  const { data: youData } = useGetYou();
  const reanaToken = youData?.reana_token?.value ?? null;
  const { data: configData } = useGetConfig();
  const quotaEnabled = (configData as any)?.quota_enabled ?? false;
  const { data: infoData } = useInfo({ access_token: "" });
  const hasGitLabIntegration =
    infoData === undefined ? null : Boolean(infoData?.gitlab_host?.value);

  return (
    <BasePage title="Your profile">
      <Container text className={styles["container"]}>
        <div>
          <Title>Your REANA token</Title>
          <Token />
        </div>
        {reanaToken && (
          <>
            {hasGitLabIntegration && (
              <div>
                <Title>Your GitLab projects</Title>
                <GitLabProjects />
              </div>
            )}
            {quotaEnabled && (
              <div>
                <Title>Your quota</Title>
                <Quota />
              </div>
            )}
          </>
        )}
      </Container>
    </BasePage>
  );
}
