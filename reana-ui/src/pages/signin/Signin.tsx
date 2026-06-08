/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetConfig } from "~/api/hooks";
import { Button, Divider, Loader, Segment } from "semantic-ui-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import SignForm from "./components/SignForm";
import SignContainer from "./components/SignContainer";
import client, { USER_OAUTH_SIGNIN_URL } from "~/client";
import { useNotification } from "~/NotificationContext";
import { useDocumentTitle } from "~/hooks";

export default function Signin() {
  useDocumentTitle("Sign in");
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: configData, isLoading: configLoading } = useGetConfig();
  const [formData, setFormData] = useState<{ email: string; password: string }>(
    { email: "", password: "" },
  );
  const [signErrors, setSignErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);

  // Show a spinner until config has settled — this prevents rendering conditional
  // UI that depends on config fields before we know their values.
  if (configLoading) {
    return (
      <SignContainer>
        <Loader active inline="centered" />
      </SignContainer>
    );
  }

  // Explicit defaults for each config field.
  // localUsers defaults to true so the email/password form is always shown
  // when config isn't available (e.g. public-API fetch fails).
  const localUsers: boolean = configData?.localUsers !== false;
  const cernSSO: boolean = !!configData?.cernSSO;
  const eoscSSO: boolean = !!configData?.eoscSSO;
  const loginProviderConfig: any[] =
    (configData?.loginProviderConfig as any[]) ?? [];
  const hideSignup: boolean = !!configData?.hideSignup;
  const adminEmail = configData?.adminEmail as string | undefined;
  const userConfirmation: boolean = !!configData?.userConfirmation;
  const accessTokenIssuancePolicy = String(
    configData?.accessTokenIssuancePolicy ?? "manual",
  )
    .trim()
    .toLowerCase();

  const tokenIssuancePolicy: "auto" | "manual" =
    accessTokenIssuancePolicy === "auto" ? "auto" : "manual";
  const shouldNotifyEmailConfirmation =
    userConfirmation && tokenIssuancePolicy !== "auto";

  const handleClick = (ssoProvider: string) => {
    const from = (location.state as any)?.from || {
      pathname: "/",
      search: "",
      hash: "",
    };
    const next = `${from.pathname}${from.search}${from.hash}`;
    window.location.href = USER_OAUTH_SIGNIN_URL(next, ssoProvider);
    if (shouldNotifyEmailConfirmation) {
      notify(
        "Success!",
        "User registered. Please confirm your email by clicking on the link we sent you.",
      );
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    setFormData({ ...formData, [target.name]: target.value });
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignErrors([]);
    try {
      await client.signIn(formData);
      queryClient.invalidateQueries({ queryKey: ["/api/you"] });
      const from = (location.state as any)?.from || { pathname: "/" };
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setSignErrors(err.response.data.errors);
      } else {
        setSignErrors([
          {
            field: "email",
            message: err?.response?.data?.message || "Sign-in failed",
          },
        ]);
      }
      setFormData({ ...formData, password: "" });
    }
  };

  return (
    <SignContainer>
      <Segment>
        {cernSSO && (
          <>
            <Button
              basic
              style={{ marginBottom: "5px" }}
              fluid
              size="large"
              onClick={() => handleClick("cern_openid")}
            >
              Sign in with CERN Single Sign-On
            </Button>
          </>
        )}
        {eoscSSO && (
          <>
            <Button
              basic
              style={{ marginBottom: "5px" }}
              fluid
              size="large"
              onClick={() => handleClick("eosc_aai")}
            >
              Sign in with EOSC EU Node AAI
            </Button>
          </>
        )}
        {loginProviderConfig.length > 0 && (
          <>
            <Button
              basic
              style={{ marginBottom: "5px" }}
              fluid
              size="large"
              onClick={() => handleClick("keycloak")}
            >
              Sign in with {loginProviderConfig[0]?.["config"]?.["title"]}{" "}
              Single Sign-On
            </Button>
          </>
        )}
        {(loginProviderConfig.length > 0 || cernSSO || eoscSSO) &&
          localUsers && (
            <Divider section horizontal>
              or
            </Divider>
          )}
        {localUsers && (
          <SignForm
            submitText="Sign in"
            handleSubmit={handleSignin}
            formData={formData}
            handleInputChange={handleInputChange}
            errors={signErrors}
          />
        )}
      </Segment>
      {hideSignup && !localUsers && cernSSO && (
        <p>
          Note that you need to hold an official CERN account in order to use
          this service.
        </p>
      )}
      {hideSignup && localUsers && (
        <p>
          If you do not have an account yet, please contact
          {adminEmail ? (
            <a href={`mailto:${adminEmail}`}> REANA administrators</a>
          ) : (
            " REANA administrators"
          )}
        </p>
      )}
      {!hideSignup && localUsers && (
        <p>
          If you do not have an account yet, please
          <Link to="/signup"> Sign up</Link> here
        </p>
      )}
    </SignContainer>
  );
}
