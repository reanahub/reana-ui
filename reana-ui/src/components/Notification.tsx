/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useRef } from "react";
import { Container, Message, Transition } from "semantic-ui-react";

import { useNotification } from "~/NotificationContext";

import styles from "./Notification.module.scss";

const AUTO_CLOSE_TIMEOUT = 16000;

interface Props {
  /** Override icon (falls back to notification type icon). */
  icon?: string | null;
  /** Override header (falls back to notification header). */
  header?: string | null;
  /** Inline message — shown instead of any context notification. */
  message?: string | React.ReactNode | null;
  closable?: boolean;
  error?: boolean;
  success?: boolean;
  warning?: boolean;
}

export default function Notification({
  icon = null,
  header = null,
  message = null,
  closable = true,
  error = false,
  success = false,
  warning = false,
}: Props) {
  const { notification, clear } = useNotification();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = !!(message || notification);
  const actionIcon = notification?.isError
    ? "warning sign"
    : notification?.isWarning
      ? "warning circle"
      : "info circle";

  if (closable && visible) {
    clearTimeout(timer.current);
    timer.current = setTimeout(clear, AUTO_CLOSE_TIMEOUT);
  }

  return (
    <Transition visible={visible} duration={300}>
      <Container text className={styles.container}>
        <Message
          icon={icon || actionIcon}
          header={header || notification?.header}
          content={message || notification?.message}
          onDismiss={closable ? clear : null}
          size="small"
          error={error || (notification && notification.isError)}
          success={
            success ||
            (notification && !notification.isError && !notification.isWarning)
          }
          warning={
            warning ||
            (notification && notification.isWarning && !notification.isError)
          }
        />
      </Container>
    </Transition>
  );
}
