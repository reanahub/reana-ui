/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Button, Grid, Image, Segment } from "semantic-ui-react";

import Config from "../../../config";
import LogoImg from "../../../images/logo-reana.svg";

import styles from "../Login.module.scss";

export default function LoginForm() {
  const handleClick = () => {
    window.location.href = Config.api + "/oauth/login/cern";
  };

  return (
    <Grid
      textAlign="center"
      verticalAlign="middle"
      className={styles["login-grid"]}
    >
      <Grid.Column className={styles["login-column"]}>
        <Image
          centered
          spaced
          src={LogoImg}
          size="medium"
          className={styles["reana-logo"]}
        />
        <Segment>
          <Button color="blue" fluid size="large" onClick={handleClick}>
            Sign in
          </Button>
        </Segment>
      </Grid.Column>
    </Grid>
  );
}
