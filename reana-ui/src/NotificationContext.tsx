/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { createContext, useCallback, useContext, useState } from "react";

export interface NotificationState {
  header: string;
  message: string;
  isError?: boolean;
  isWarning?: boolean;
}

interface NotificationContextValue {
  notification: NotificationState | null;
  /** Show a notification. Pass `{ error: true }` or `{ warning: true }` for styling. */
  notify: (
    header: string,
    message: string,
    options?: { error?: boolean; warning?: boolean },
  ) => void;
  /** Extract a human-readable message from an Axios/fetch error and show it. */
  notifyError: (error: unknown) => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notification: null,
  notify: () => {},
  notifyError: () => {},
  clear: () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );

  const notify = useCallback(
    (
      header: string,
      message: string,
      options: { error?: boolean; warning?: boolean } = {},
    ) => {
      setNotification({
        header,
        message,
        isError: options.error,
        isWarning: options.warning,
      });
    },
    [],
  );

  const notifyError = useCallback((error: unknown) => {
    const message =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      "An error has occurred";
    setNotification({ header: "An error occurred", message, isError: true });
  }, []);

  const clear = useCallback(() => setNotification(null), []);

  return (
    <NotificationContext.Provider
      value={{ notification, notify, notifyError, clear }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  return useContext(NotificationContext);
}
