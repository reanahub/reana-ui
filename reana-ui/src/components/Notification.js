/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Message, Transition } from "semantic-ui-react";
import PropTypes from "prop-types";

import { clearError } from "../actions";
import { getError } from "../selectors";

import styles from "./Notification.module.scss";

const AUTO_CLOSE_TIMEOUT = 16000;

export default function Notification({ icon, header, message, closable }) {
  const dispatch = useDispatch();
  const error = useSelector(getError);
  const timer = useRef(null);

  const hide = () => dispatch(clearError);
  const visible = message || error ? true : false;

  if (closable && visible) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => hide(), AUTO_CLOSE_TIMEOUT);
  }

  return (
    <Transition visible={visible} duration={300}>
      <Container text className={styles.container}>
        <Message
          icon={icon}
          header={header}
          content={message || error?.message}
          onDismiss={closable ? hide : null}
          size="small"
          error
        />
      </Container>
    </Transition >
  );
}

Notification.propTypes = {
  icon: PropTypes.string,
  header: PropTypes.string,
  message: PropTypes.string,
  closable: PropTypes.bool
};

Notification.defaultProps = {
  icon: "warning sign",
  header: "An error has occurred",
  message: null,
  closable: true
};
