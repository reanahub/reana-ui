/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";

import { Icon } from "semantic-ui-react";

import config from "../config";

import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles["footer-bottom"]}>
      <span>Copyright © 2020 CERN</span>
      <span className={styles["links"]}>
        <a href={config.docsURL} target="_blank" rel="noopener noreferrer">
          <Icon name="book"></Icon> Docs
        </a>
        <a href={config.forumURL} target="_blank" rel="noopener noreferrer">
          <Icon name="discourse"></Icon> Forum
        </a>
        <a
          href={config.mattermostURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="conversation"></Icon> Chat
        </a>
      </span>
    </footer>
  );
}
