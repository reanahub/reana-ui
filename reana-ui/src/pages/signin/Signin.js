/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Divider, Grid, Image, Segment } from "semantic-ui-react";
import { Link, useHistory, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import { getConfig } from "../../selectors";
import SignForm from "./components/SignForm";
import { api } from "../../config";
import { userSignup, userSignin } from "../../actions";
import LogoImg from "../../images/logo-reana.svg";

import styles from "./Signin.module.scss";

export default function Signin({ signup }) {
  const config = useSelector(getConfig);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleClick = () => {
    window.location.href = api + "/oauth/login/cern";
  };

  const handleSubmit = (event, action) => {
    const { from } = location.state || { from: { pathname: "/" } };
    dispatch(action(formData)).then((res) => {
      if (res.isAxiosError ?? false) {
        setFormData({ ...formData, password: "" });
      } else {
        history.replace(from);
      }
    });
    event.preventDefault();
  };

  const handleInputChange = (event) => {
    const target = event.target;
    setFormData({ ...formData, [target.name]: target.value });
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
            {config.cernSSO && !signup && (
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
                handleSubmit={(e) =>
                  handleSubmit(e, signup ? userSignup : userSignin)
                }
                formData={formData}
                handleInputChange={handleInputChange}
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
  /** Whether to show signup instead of signin form. */
  signup: PropTypes.bool,
};

Signin.defatultProps = {
  signup: false,
};
