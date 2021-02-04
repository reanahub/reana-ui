/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Divider, Segment } from "semantic-ui-react";
import { Link } from "react-router-dom";

import SignForm from "./components/SignForm";
import SignContainer from "./components/SignContainer";
import { api } from "../../config";
import { getConfig } from "../../selectors";
import { triggerNotification, userSignin } from "../../actions";
import { useSubmit } from "../../hooks";

export default function Signin() {
  const handleSubmit = useSubmit(userSignin);
  const config = useSelector(getConfig);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleClick = () => {
    window.location.href = api + "/oauth/login/cern";
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
            <Button basic fluid size="large" onClick={handleClick}>
              Sign in with SSO
            </Button>
            {config.localUsers && (
              <Divider section horizontal>
                or
              </Divider>
            )}
          </>
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
      {config.hideSignup && (
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
