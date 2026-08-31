/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container, Message, Transition } from "semantic-ui-react";
import PropTypes from "prop-types";

import styles from "./Notification.module.scss";

export default function Notification({
  icon,
  header,
  message,
  error,
  success,
  warning,
  onDismiss,
}) {
  const actionIcon = error
    ? "warning sign"
    : warning
      ? "warning circle"
      : "info circle";

  return (
    <Transition visible={!!(header || message)} duration={300}>
      <Container text className={styles.container}>
        <Message
          icon={icon || actionIcon}
          header={header}
          content={message}
          onDismiss={onDismiss}
          size="small"
          error={error}
          success={success}
          warning={warning}
        />
      </Container>
    </Transition>
  );
}

Notification.propTypes = {
  icon: PropTypes.string,
  header: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  error: PropTypes.bool,
  success: PropTypes.bool,
  warning: PropTypes.bool,
  onDismiss: PropTypes.func,
};

Notification.defaultProps = {
  icon: null,
  header: null,
  message: null,
  error: false,
  success: false,
  warning: false,
  onDismiss: null,
};
