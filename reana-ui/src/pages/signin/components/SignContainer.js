/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Grid, Image } from "semantic-ui-react";
import PropTypes from "prop-types";

import LogoImg from "../../../images/logo-reana.svg";

import styles from "./SignContainer.module.scss";

export default function SignContainer({ children }) {
  return (
    <div className={styles["signin-form"]}>
      <Grid
        textAlign="center"
        verticalAlign="middle"
        className={styles["signin-grid"]}
      >
        <Grid.Column className={styles["signin-column"]}>
          <Image
            centered
            spaced
            src={LogoImg}
            size="medium"
            className={styles["reana-logo"]}
          />
          {children}
        </Grid.Column>
      </Grid>
    </div>
  );
}

SignContainer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};
