/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

	REANA is free software; you can redistribute it and/or modify it under the
	terms of the GNU General Public License as published by the Free Software
	Foundation; either version 2 of the License, or (at your option) any later
	version.

	REANA is distributed in the hope that it will be useful, but WITHOUT ANY
	WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
	A PARTICULAR PURPOSE. See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with REANA; if not, see <http://www.gnu.org/licenses>.

	In applying this license, CERN does not waive the privileges and immunities
	granted to it by virtue of its status as an Intergovernmental Organization or
	submit itself to any jurisdiction.
*/

import React, { Component } from "react";
import history from "../history";
import { Segment, Image, Menu, Icon } from "semantic-ui-react";
import LogoImg from "../images/logo-reana.svg";
import Cookies from "universal-cookie";
import "./Header.css";

const cookies = new Cookies();

export default class Header extends Component {
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
