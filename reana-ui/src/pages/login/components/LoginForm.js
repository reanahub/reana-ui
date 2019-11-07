/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import {
  Button,
  Divider,
  Grid,
  Image,
  Message,
  Segment
} from "semantic-ui-react";
import { useSelector } from "react-redux";
import { isLoggedIn, getUserEmail } from "../../../selectors";
import { Link } from "react-router-dom";
import Config from "../../../config";
import LogoImg from "../../../images/logo-reana.svg";

export default function LoginForm() {
  const loggedIn = useSelector(isLoggedIn);
  const userEmail = useSelector(getUserEmail);
  const handleClick = () => {
    window.location.href = Config.api + "/oauth/login/cern";
  };
  return (
    <div className="login-form">
      <Grid textAlign="center" verticalAlign="middle" className="login-grid">
        <Grid.Column className="login-column">
          <Image centered spaced src={LogoImg} size="small" />
          <Divider />
          {loggedIn ? (
            <>
              Hello {userEmail}
              <Segment basic floated="left" style={{ margin: "0px" }}>
                Go to <Link to="/projects">my GitLab projects</Link>
              </Segment>
            </>
          ) : (
            <>
              <Segment>
                <Button color="blue" fluid size="large" onClick={handleClick}>
                  Login
                </Button>
              </Segment>
              <Message>
                New user? <a href="mailto:info@reana.io">Request a token</a>
              </Message>
            </>
          )}
          <Divider />
        </Grid.Column>
      </Grid>
    </div>
  );
}
