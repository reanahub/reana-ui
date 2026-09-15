/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container } from "semantic-ui-react";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { getConfig } from "~/selectors";
import { loadUser } from "~/actions";
import BasePage from "../BasePage";
import GitLabProjects from "./components/GitLabProjects";
import Token from "./components/Token";
import Quota from "./components/Quota";
import { Title } from "~/components";

import styles from "./Profile.module.scss";
import client from "~/client";

export default function Profile() {
  const dispatch = useDispatch();
  const { quotaEnabled } = useSelector(getConfig);

  const [hasGitLabIntegration, setHasGitLabIntegration] = useState(null);

  useEffect(() => {
    dispatch(loadUser({ loader: false }));
  }, [dispatch]);

  useEffect(() => {
    client
      .getClusterInfo()
      .then((res) => {
        const gitlabHostValue = res?.data?.gitlab_host?.value;
        // GitLab integration is enabled only when the host is present and non-empty
        setHasGitLabIntegration(Boolean(gitlabHostValue));
      })
      .catch(() => {
        // If the cluster info endpoint fails, assume GitLab integration is not configured
        setHasGitLabIntegration(false);
      });
  }, []);

  return (
    <BasePage title="Your profile">
      <Container text className={styles["container"]}>
        <div>
          <Title>Your REANA session</Title>
          <Token />
        </div>
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
      </Container>
    </BasePage>
  );
}
