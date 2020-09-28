/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Container } from "semantic-ui-react";

import BasePage from "../BasePage";
import GitLabProjects from "./components/GitLabProjects";
import Token from "./components/Token";
import Quota from "./components/Quota";
import { Title } from "../../components";

import styles from "./Profile.module.scss";

export default function Profile() {
  return (
    <BasePage>
      <Container text className={styles["container"]}>
        <div>
          <Title>Your REANA token</Title>
          <Token />
        </div>
        <div>
          <Title>Your GitLab projects</Title>
          <GitLabProjects />
        </div>
        <div>
          <Title>Your quota</Title>
          <Quota />
        </div>
      </Container>
    </BasePage>
  );
}
