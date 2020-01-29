/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";

import LoginForm from "./components/LoginForm";
import Footer from "../../components/Footer";

import styles from "./Login.module.scss";

export default function LoginPage() {
  return (
    <div className={styles["login-form"]}>
      <LoginForm />
      <Footer />
    </div>
  );
}
