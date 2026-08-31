/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { clearNotification } from "~/actions";
import { getNotification } from "~/selectors";

import Notification from "./Notification";

const AUTO_CLOSE_TIMEOUT = 16000;

export default function GlobalNotification() {
  const dispatch = useDispatch();
  const notification = useSelector(getNotification);
  const hide = () => dispatch(clearNotification);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(
      () => dispatch(clearNotification),
      AUTO_CLOSE_TIMEOUT,
    );
    return () => clearTimeout(timer);
  }, [dispatch, notification]);

  const error = notification?.isError;
  const warning = notification?.isWarning && !error;

  return (
    <Notification
      header={notification?.header}
      message={notification?.message}
      onDismiss={hide}
      error={error}
      warning={warning}
      success={notification && !error && !warning}
    />
  );
}
