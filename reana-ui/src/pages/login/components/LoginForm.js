/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios from "axios";
import React, { Component } from "react";
import history from "../../../history";
import {
  Button,
  Divider,
  Form,
  Grid,
  Image,
  Message,
  Segment
} from "semantic-ui-react";

import LogoImg from "../../../images/logo-reana.svg";
import Config from "../../../config";


export default class LoginForm extends Component {
  /**
   * Variables defining the state of the components
   */
  constructor(props) {
    super(props);
    this.state = {
      input_email: "",
      input_token: "",
      show_message: false
    };
  }

  /**
   * Updates state variables given user input
   */
  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  /**
   * Handling submit button
   */
  handleSubmit = () => {
    const { input_email, input_token } = this.state;

    axios({
      method: "post",
      url: Config.api + "/auth",
      headers: {
        "Content-type": "application/json",
      },
      data: {
        username: input_email,
        password: input_token
      },
      withCredentials: true
    }).then(res => {
        this.setState({ show_message: false });
        history.push("/workflows");
      })
      .catch(error => {
        this.setState({ show_message: true });
      });
  };

  render() {
    const { input_email, input_token, show_message } = this.state;
    return (
      <div className="login-form">
        <Grid textAlign="center" verticalAlign="middle" className="login-grid">
          <Grid.Column className="login-column">
            <Image centered spaced src={LogoImg} size="small" />
            <Divider />
            <Form size="large" onSubmit={this.handleSubmit}>
              <Segment>
                <Form.Input
                  fluid
                  icon="user"
                  iconPosition="left"
                  placeholder="E-mail"
                  name="input_email"
                  value={input_email}
                  onChange={this.handleChange}
                />
                <Form.Input
                  fluid
                  icon="lock"
                  iconPosition="left"
                  placeholder="Token"
                  name="input_token"
                  value={input_token}
                  onChange={this.handleChange}
                  type="password"
                />

                <Button color="blue" fluid size="large">
                  Login
                </Button>
                <Message
                  visible={show_message}
                  error
                  header="Invalid user / token"
                  content="Please introduce a valid user and token"
                />
              </Segment>
            </Form>
            <Message>
              New to us? <a href="mailto:info@reana.io">Ask for a token</a>
            </Message>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}
