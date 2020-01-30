/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Container, Header } from "semantic-ui-react";

import BasePage from "../BasePage";
import GitLabProjects from "./components/GitLabProjects";
import Token from "./components/Token";

import styles from "./Profile.module.scss";

export default function Profile() {
  return (
    <BasePage>
      <Container text className={styles["container"]}>
        <div>
          <Header as="h2">Your REANA token</Header>
          <Token />
        </div>
        <div>
          <Header as="h2">Your GitLab projects</Header>
          <GitLabProjects />
        </div>
      </Container>
    </BasePage>
  );
}
