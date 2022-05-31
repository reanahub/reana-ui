/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Image, Icon, Popup, List } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { getUserEmail } from "~/selectors";
import LogoImg from "~/images/logo-reana.svg";
import { userSignout } from "~/actions";
import NotificationBell from "./NotificationBell";

import styles from "./TopHeader.module.scss";

export default function TopHeader() {
  const dispatch = useDispatch();
  const email = useSelector(getUserEmail);
  const signOut = () => dispatch(userSignout());

  return (
    <header className={styles["top-header"]}>
      <Link to="/">
        <Image src={LogoImg} size="small" />
      </Link>
      <section>
        <NotificationBell />
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
              <List.Item>
                <Link to="/profile">Your profile</Link>
              </List.Item>
              <List.Item as="a" onClick={signOut}>
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
