/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { Icon, Popup } from "semantic-ui-react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import styles from "./CodeSnippet.module.scss";

const COPY_CHECK_TIMEOUT = 1500;

export default function CodeSnippet({ children }) {
  const [copied, setCopied] = useState(false);

  const handleCopied = () => {
    setCopied(true);

    const timeout = setTimeout(() => {
      setCopied(false);
      clearTimeout(timeout);
    }, COPY_CHECK_TIMEOUT);
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["content"]}>{children}</div>
      <Popup
        trigger={
          <CopyToClipboard text={children} onCopy={handleCopied}>
            <Icon name="copy outline" className={styles["copy-icon"]} />
          </CopyToClipboard>
        }
        content="Copied!"
        open={copied}
        inverted
      />
    </div>
  );
}
