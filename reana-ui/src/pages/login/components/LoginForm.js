/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2018 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { Button, Grid, Input, Image, Segment, Popup } from "semantic-ui-react";
import { useSelector } from "react-redux";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { isLoggedIn, getUserFullName, getReanaToken } from "../../../selectors";
import Config from "../../../config";
import LogoImg from "../../../images/logo-reana.svg";

const COPY_CHECK_TIMEOUT = 1500;

export default function LoginForm() {
  const [copied, setCopied] = useState(false);
  const loggedIn = useSelector(isLoggedIn);
  const userFullName = useSelector(getUserFullName);
  const reanaToken = useSelector(getReanaToken);
  const handleClick = () => {
    window.location.href = Config.api + "/oauth/login/cern";
  };

  const handleCopied = () => {
    setCopied(true);

    const timeout = setTimeout(() => {
      setCopied(false);
      clearTimeout(timeout);
    }, COPY_CHECK_TIMEOUT);
  };

  return (
    <div className="login-form">
      <Grid textAlign="center" verticalAlign="middle" className="login-grid">
        <Grid.Column className="login-column">
          <Image
            centered
            spaced
            src={LogoImg}
            size="medium"
            className="reana-logo"
          />
          {loggedIn ? (
            <div className="welcome-msg">
              <div>Hello {userFullName}!</div>
              <div>
                {" "}
                Your REANA command-line token is:
                <div className="token-container">
                  <Input value={reanaToken} className="token-input" action>
                    <input />

                    <Popup
                      trigger={
                        <CopyToClipboard
                          text={reanaToken}
                          onCopy={handleCopied}
                        >
                          <Button primary icon="copy" />
                        </CopyToClipboard>
                      }
                      content="Copied."
                      open={copied}
                      inverted
                    />
                  </Input>
                </div>
              </div>
              <div>
                <a href="https://reana-client.readthedocs.io/en/latest/gettingstarted.html">
                  How to use it?
                </a>
              </div>
            </div>
          ) : (
            <>
              <Segment className="signin">
                <Button color="blue" fluid size="large" onClick={handleClick}>
                  Sign in
                </Button>
              </Segment>
            </>
          )}
        </Grid.Column>
      </Grid>
      <footer className="footer-bottom">
        <span>
          © 2019 CERN · <a href="http://www.reana.io">www.reana.io</a>
        </span>
      </footer>
    </div>
  );
}
