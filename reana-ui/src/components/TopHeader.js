/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Image, Icon, Popup, List } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { getUserEmail } from "../selectors";
import LogoImg from "../images/logo-reana.svg";
import { userLogout } from "../actions";
import config from "../config";

import styles from "./TopHeader.module.scss";

export default function TopHeader() {
  const dispatch = useDispatch();
  const email = useSelector(getUserEmail);
  const logOut = () => {
    dispatch(userLogout());
  };

  return (
    <header className={styles["top-header"]}>
      <Link to="/">
        <Image src={LogoImg} size="small" />
      </Link>
      <section>
        <a href={config.docsURL} target="_blank" rel="noopener noreferrer">
          <Icon name="question circle outline"></Icon> Help
        </a>
        <Popup
          trigger={
            <Icon
              link
              name="user outline"
              size="large"
              color="brown"
              className={styles["user-icon"]}
            />
          }
          content={
            <List>
              <List.Item>
                <List.Header>{email}</List.Header>
              </List.Item>
              <List.Item as="a" href="/profile">
                Your profile
              </List.Item>
              <List.Item as="a" onClick={logOut}>
                Sign out
              </List.Item>
            </List>
          }
          position="bottom right"
          on="click"
        />
      </section>
    </header>
  );
}
