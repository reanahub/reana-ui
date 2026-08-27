/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Message, Segment } from "semantic-ui-react";

import { getConfig } from "~/selectors";
import SignContainer from "./components/SignContainer";
import { api } from "~/config";
import { useDocumentTitle } from "~/hooks";

export default function Signin() {
  useDocumentTitle("Sign in");
  const config = useSelector(getConfig);
  const location = useLocation();
  const navigate = useNavigate();
  const bffAuth = config.auth ?? {};
  const bffEnabled = Boolean(bffAuth.bff_enabled);
  const currentQuery = new URLSearchParams(location.search);
  const fromQuery = new URLSearchParams(location.state?.from?.search ?? "");
  const [loginError] = useState(
    currentQuery.get("login_error") ?? fromQuery.get("login_error"),
  );

  const loginErrorMessages = {
    authorization:
      "Sign-in was cancelled or not authorised by the identity provider. Please try again.",
    provisioning:
      "REANA could not create or link your account. Contact the deployment administrator.",
  };

  useEffect(() => {
    if (!loginError) return;

    currentQuery.delete("login_error");
    fromQuery.delete("login_error");
    const from = location.state?.from;
    navigate(
      {
        pathname: location.pathname,
        search: currentQuery.toString() ? `?${currentQuery.toString()}` : "",
        hash: location.hash,
      },
      {
        replace: true,
        state: from
          ? {
              ...location.state,
              from: {
                ...from,
                search: fromQuery.toString() ? `?${fromQuery.toString()}` : "",
              },
            }
          : location.state,
      },
    );
  }, [loginError]); // eslint-disable-line react-hooks/exhaustive-deps

  const getNext = () => {
    const from = location.state?.from || {
      pathname: "/",
      search: "",
      hash: "",
    };
    return `${from.pathname}${from.search}${from.hash}`;
  };

  const handleBffClick = () => {
    const query = new URLSearchParams({ next: getNext() });
    window.location.href = `${api}${
      bffAuth.login_url ?? "/api/login"
    }?${query.toString()}`;
  };

  return (
    <SignContainer>
      <Segment>
        {loginError && (
          <Message
            negative
            header="Sign-in failed"
            content={
              loginErrorMessages[loginError] ??
              "REANA could not complete sign-in. Please try again or contact the deployment administrator."
            }
          />
        )}
        <Button
          basic
          style={{ marginBottom: "5px" }}
          fluid
          size="large"
          disabled={!bffEnabled}
          onClick={handleBffClick}
        >
          Sign in with identity provider
        </Button>
      </Segment>
    </SignContainer>
  );
}
