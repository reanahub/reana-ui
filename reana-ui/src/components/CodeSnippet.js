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
import PropTypes from "prop-types";

import styles from "./CodeSnippet.module.scss";

const COPY_CHECK_TIMEOUT = 1500;

export default function CodeSnippet({
  children,
  dark,
  small,
  copy,
  reveal,
  dollarPrefix,
  classes
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopied = () => {
    setCopied(true);

    const timeout = setTimeout(() => {
      setCopied(false);
      clearTimeout(timeout);
    }, COPY_CHECK_TIMEOUT);
  };

  const toggleRevealed = () => {
    setRevealed(!revealed);
  };

  const accessChildren = element => {
    if (Array.isArray(element)) {
      return element.map(el =>
        el.props?.children ? accessChildren(el.props.children) : el
      );
    } else {
      return element;
    }
  };

  return (
    <div
      className={`${styles["container"]} ${
        dark ? styles["dark"] : ""
      } ${classes}`}
    >
      <div
        className={`${styles["content"]} ${small ? styles["small"] : ""} ${
          dollarPrefix ? styles["dollar"] : ""
        } ${revealed ? styles["revealed"] : ""}`}
      >
        {children}
      </div>
      {reveal && (
        <Icon
          name={revealed ? "eye slash" : "eye"}
          className={styles["action-icon"]}
          onClick={toggleRevealed}
        />
      )}
      {copy && (
        <Popup
          trigger={
            <CopyToClipboard
              text={accessChildren(children)
                .map(line => line.join(""))
                .join("\n")}
              onCopy={handleCopied}
            >
              <Icon name="copy outline" className={styles["action-icon"]} />
            </CopyToClipboard>
          }
          content="Copied!"
          open={copied}
          inverted
        />
      )}
    </div>
  );
}

CodeSnippet.propTypes = {
  dark: PropTypes.bool,
  small: PropTypes.bool,
  copy: PropTypes.bool,
  reveal: PropTypes.bool,
  dollarPrefix: PropTypes.bool,
  classes: PropTypes.string
};

CodeSnippet.defaultProps = {
  dark: false,
  small: false,
  copy: false,
  reveal: false,
  dollarPrefix: true,
  classes: ""
};
