/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Popup, Icon, List } from "semantic-ui-react";

import { getUserQuota } from "~/selectors";
import { getQuotaNotifications } from "~/pages/profile/components/Quota";

export default function NotificationBell() {
  const quota = useSelector(getUserQuota);
  const notifications = getQuotaNotifications(quota);
  const hasNotifications = !!notifications.length;
  return (
    <Popup
      trigger={
        <Icon.Group size="large">
          <Icon link name="bell outline" color="brown" />
          {hasNotifications && (
            <Icon corner="top right" name="circle" color="red" />
          )}
        </Icon.Group>
      }
      content={
        <List divided relaxed>
          {!hasNotifications && (
            <List.Item>You have no notifications</List.Item>
          )}
          {notifications.map((notification, index) => (
            <List.Item key={index} as={Link} to={notification.link}>
              <List.Icon
                color="grey"
                verticalAlign="middle"
                name={notification.icon}
              />
              <List.Content>
                <List.Header style={{ marginBottom: "0.2em" }}>
                  {notification.header}
                </List.Header>
                <List.Description>{notification.body}</List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      }
      position="bottom right"
      on="click"
    />
  );
}
