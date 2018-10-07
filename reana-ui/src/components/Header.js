/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import history from "../history";
import { Segment, Image, Menu, Icon } from "semantic-ui-react";
import LogoImg from "../images/logo-reana.svg";
import Cookies from "universal-cookie";
import "./Header.css";

const cookies = new Cookies();

export default class Header extends Component {
  /**
   * Logs out the current session
   */
  logOut = () => {
    cookies.remove("user_token");
    cookies.remove("jwt_token");
    cookies.remove("workflow-id");
    cookies.remove("workflow-name");
    cookies.remove("workflow-run");
    cookies.remove("workflow-created");
    cookies.remove("workflow-status");
    history.replace("/");
  };

  render() {
    return (
      <Segment secondary clearing attached="top" padded>
        <Image
          src={LogoImg}
          size="small"
          floated="left"
          style={{ margin: "0px" }}
        />
        <Menu size="large" floated="right">
          <Menu.Item href="http://www.reana.io" target="_blank">
            About
          </Menu.Item>
          <Menu.Item
            href="https://reana.readthedocs.io/en/latest/"
            target="_blank"
          >
            Documentation
          </Menu.Item>
          <Menu.Item
            className="logout-button"
            onClick={this.logOut}
            style={{ backgroundColor: "#0088CB", color: "white" }}
          >
            <Icon inverted name="user" />
            Log out
          </Menu.Item>
        </Menu>
      </Segment>
    );
  }
}
