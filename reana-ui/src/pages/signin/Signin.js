/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Button, Divider, Grid, Image, Segment } from "semantic-ui-react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

import SignForm from "./components/SignForm";
import config from "../../config";
import LogoImg from "../../images/logo-reana.svg";

import styles from "./Signin.module.scss";

export default function Signin({ signup }) {
  const handleClick = () => {
    window.location.href = config.api + "/oauth/login/cern";
  };

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
          <Segment>
            {config.sso && !signup && (
              <>
                <Button basic fluid size="large" onClick={handleClick}>
                  Sign in with SSO
                </Button>
                {config.localUsers && (
                  <Divider section horizontal>
                    or
                  </Divider>
                )}
              </>
            )}
            {config.localUsers && (
              <SignForm
                submitText={signup ? "Sign up" : "Sign in"}
                handleSubmit={() => alert("signin submit")}
              />
            )}
          </Segment>
          {config.localUsers && (
            <>
              {!signup ? (
                <p>
                  Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
              ) : (
                <p>
                  Already signed up? Go to <Link to="/signin">Sign In</Link>
                </p>
              )}
            </>
          )}
        </Grid.Column>
      </Grid>
    </div>
  );
}

Signin.propTypes = {
  signup: PropTypes.bool
};

Signin.defatultProps = {
  signup: false
};
