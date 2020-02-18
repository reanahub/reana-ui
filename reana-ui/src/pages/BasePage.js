/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Footer, TopHeader } from "../components";

import styles from "./BasePage.module.scss";

export default function BasePage({ children }) {
  return (
    <div className={styles["reana-page"]}>
      <TopHeader />
      <div className={styles["main"]}>{children}</div>
      <Footer />
    </div>
  );
}
