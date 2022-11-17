/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container } from "semantic-ui-react";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { getConfig, getReanaToken } from "~/selectors";
import { loadUser } from "~/actions";
import BasePage from "../BasePage";
import GitLabProjects from "./components/GitLabProjects";
import Token from "./components/Token";
import Quota from "./components/Quota";
import { Title } from "~/components";

import styles from "./Profile.module.scss";

export default function Profile() {
  const dispatch = useDispatch();
  const reanaToken = useSelector(getReanaToken);
  const { quotaEnabled } = useSelector(getConfig);

  useEffect(() => dispatch(loadUser({ loader: false })), [dispatch]);

  return (
    <BasePage title="Your profile">
      <Container text className={styles["container"]}>
        <div>
          <Title>Your REANA token</Title>
          <Token />
        </div>
        {reanaToken && (
          <>
            <div>
              <Title>Your GitLab projects</Title>
              <GitLabProjects />
            </div>
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
