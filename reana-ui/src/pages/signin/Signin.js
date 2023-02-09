/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Divider, Segment } from "semantic-ui-react";
import { Link, useLocation } from "react-router-dom";

import { getConfig } from "~/selectors";
import SignForm from "./components/SignForm";
import SignContainer from "./components/SignContainer";
import { USER_OAUTH_SIGNIN_URL } from "~/client";
import { triggerNotification, userSignin } from "~/actions";
import { useSubmit, useDocumentTitle } from "~/hooks";

export default function Signin() {
  useDocumentTitle("Sign in");
  const handleSubmit = useSubmit(userSignin);
  const config = useSelector(getConfig);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const location = useLocation();

  const handleClick = (ssoProvider) => {
    const from = location.state?.from || {
      pathname: "/",
      search: "",
      hash: "",
    };
    const next = `${from.pathname}${from.search}${from.hash}`;
    window.location.href = USER_OAUTH_SIGNIN_URL(next, ssoProvider);
    // FIXME: We assume that the sign-up went successfully but we actually don't know.
    // We should upgrade Invenio-OAuthClient to latest version that supports REST apps
    // and adapt the whole workflow.
    if (config.userConfirmation) {
      dispatch(
        triggerNotification(
          "Success!",
          "User registered. Please confirm your email by clicking on the link we sent you."
        )
      );
    }
  };

  const handleInputChange = (event) => {
    const { target } = event;
    setFormData({ ...formData, [target.name]: target.value });
  };

  return (
    <SignContainer>
      <Segment>
        {config.cernSSO && (
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
        {config.loginProviderConfig.length > 0 && (
          <>
            <Button
              basic
              style={{ marginBottom: "5px" }}
              fluid
              size="large"
              onClick={() => handleClick("keycloak")}
            >
              Sign in with {config.loginProviderConfig[0]["config"]["title"]}{" "}
              Single Sign-On
            </Button>
          </>
        )}
        {(config.loginProviderConfig.length > 0 || config.cernSSO) &&
          config.localUsers && (
            <Divider section horizontal>
              or
            </Divider>
          )}
        {config.localUsers && (
          <SignForm
            submitText="Sign in"
            handleSubmit={(e) => handleSubmit(e, formData, setFormData)}
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )}
      </Segment>
      {config.hideSignup && !config.localUsers && config.cernSSO && (
        <p>
          Note that you need to hold an official CERN account in order to use
          this service.
        </p>
      )}
      {config.hideSignup && config.localUsers && (
        <p>
          If you do not have an account yet, please contact
          <a href={`mailto:${config.adminEmail}`}> REANA administrators</a>
        </p>
      )}
      {!config.hideSignup && config.localUsers && (
        <p>
          If you do not have an account yet, please
          <Link to="/signup"> Sign up</Link> here
        </p>
      )}
    </SignContainer>
  );
}
