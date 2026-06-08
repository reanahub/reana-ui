/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Link } from "react-router-dom";
import { Icon } from "semantic-ui-react";

import { useGetConfig } from "~/api/hooks";

import styles from "./Footer.module.scss";

export default function Footer() {
  const config = useGetConfig().data ?? ({} as any);
  return (
    <footer className={styles["footer-bottom"]}>
      <span className={styles["links"]}>
        {config.privacyNoticeURL && (
          <a
            href={config.privacyNoticeURL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="privacy"></Icon> Privacy notice
          </a>
        )}
      </span>
      <span className={styles["links"]}>
        {config.docsURL && (
          <a href={config.docsURL} target="_blank" rel="noopener noreferrer">
            <Icon name="book"></Icon> Docs
          </a>
        )}
        {config.forumURL && (
          <a href={config.forumURL} target="_blank" rel="noopener noreferrer">
            <Icon name="discourse"></Icon> Forum
          </a>
        )}
        {config.chatURL && (
          <a href={config.chatURL} target="_blank" rel="noopener noreferrer">
            <Icon name="conversation"></Icon> Chat
          </a>
        )}
        <Link to="/status">
          <Icon name="heartbeat"></Icon>Cluster health
        </Link>
      </span>
    </footer>
  );
}
