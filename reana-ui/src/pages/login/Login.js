/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import LoginForm from "./components/LoginForm";
import "./Login.scss";

export default class LoginPage extends Component {
  render() {
    return <LoginForm />;
  }
}
