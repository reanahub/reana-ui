/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container } from "semantic-ui-react";
import { useSelector } from "react-redux";

import { getReanaToken } from "~/selectors";
import BasePage from "../BasePage";
import GitLabProjects from "./components/GitLabProjects";
import Token from "./components/Token";
import Quota from "./components/Quota";
import { Title } from "~/components";

import styles from "./Profile.module.scss";

export default function Profile() {
  const reanaToken = useSelector(getReanaToken);
  return (
    <BasePage>
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
            <div>
              <Title>Your quota</Title>
              <Quota />
            </div>
          </>
        )}
      </Container>
    </BasePage>
  );
}
