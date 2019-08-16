/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import {
  Button,
  Divider,
  Grid,
  Image,
  Message,
  Segment
} from "semantic-ui-react";
import { Link } from "react-router-dom";
import Config from "../../../config";
import LogoImg from "../../../images/logo-reana.svg";

export default class LoginForm extends Component {

  handleClick = () => {
    window.location.href = Config.api + "/oauth/login/cern"
  }

  render() {
    return (
      <div className="login-form">
        <Grid textAlign="center" verticalAlign="middle" className="login-grid">
          <Grid.Column className="login-column">
            <Image centered spaced src={LogoImg} size="small" />
            <Divider />
              <Segment>
                <Button color="blue" fluid size="large" onClick={this.handleClick}>
                  Login
                </Button>
              </Segment>
            <Message>
              New user? <a href="mailto:info@reana.io">Request a token</a>
            </Message>
            <Divider />
            <Segment basic floated="left" style={{ margin: "0px" }}>
              Go to <Link to="/projects">my GitLab projects</Link>
            </Segment>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
