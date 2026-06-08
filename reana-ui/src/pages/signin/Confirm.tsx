/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import client from "~/client";
import { useNotification } from "~/NotificationContext";

export default function Confirm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { notify, notifyError } = useNotification();

  useEffect(() => {
    client
      .confirmEmail({ token })
      .then((resp) => {
        notify("Success!", (resp.data as any)?.message || "Email confirmed.");
        navigate("/", { replace: true });
      })
      .catch((err: any) => {
        notifyError(err);
        navigate("/", { replace: true });
      });
  }, [token, navigate]);

  return null;
}
