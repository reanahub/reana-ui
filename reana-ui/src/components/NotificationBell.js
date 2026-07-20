/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Popup, Icon, List } from "semantic-ui-react";

import {
  getPersistentNotifications,
  getPersistentNotificationsUnreadCount,
  getUserQuota,
} from "~/selectors";
import { getQuotaNotifications } from "~/pages/profile/components/Quota";
import {
  markAllPersistentNotificationsRead,
  markPersistentNotificationRead,
} from "~/actions";

export default function NotificationBell() {
  const dispatch = useDispatch();
  const quota = useSelector(getUserQuota);
  const quotaNotifications = getQuotaNotifications(quota);
  const notifications = useSelector(getPersistentNotifications);
  const unreadCount = useSelector(getPersistentNotificationsUnreadCount);
  const hasNotifications = !!(quotaNotifications.length || notifications.length);
  const hasUnread = !!(quotaNotifications.length || unreadCount);

  const getNotificationContent = (notification) => {
    if (notification.type === "workflow_shared") {
      return {
        header: `${notification.payload.sharer_email} shared a workflow`,
        body: notification.payload.workflow_name,
        icon: "share alternate",
        link: `/workflows/${notification.payload.workflow_id}`,
      };
    }
    return {
      header: "Notification",
      body: "",
      icon: "bell",
      link: "/",
    };
  };

  return (
    <Popup
      trigger={
        <Icon.Group size="large">
          <Icon link name="bell outline" color="brown" />
          {hasUnread && (
            <Icon corner="top right" name="circle" color="red" />
          )}
        </Icon.Group>
      }
      content={
        <List divided relaxed>
          {!hasNotifications && (
            <List.Item>You have no notifications</List.Item>
          )}
          {quotaNotifications.map((notification, index) => (
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
          {notifications.map((notification) => {
            const content = getNotificationContent(notification);
            return (
              <List.Item
                key={notification.id}
                as={Link}
                to={content.link}
                onClick={() =>
                  !notification.read_at &&
                  dispatch(markPersistentNotificationRead(notification.id))
                }
              >
                <List.Icon
                  color={notification.read_at ? "grey" : "brown"}
                  verticalAlign="middle"
                  name={content.icon}
                />
                <List.Content>
                  <List.Header style={{ marginBottom: "0.2em" }}>
                    {content.header}
                  </List.Header>
                  <List.Description>{content.body}</List.Description>
                </List.Content>
              </List.Item>
            );
          })}
          {unreadCount > 0 && (
            <List.Item>
              <Button
                basic
                fluid
                size="tiny"
                onClick={() => dispatch(markAllPersistentNotificationsRead())}
              >
                Mark all read
              </Button>
            </List.Item>
          )}
        </List>
      }
      position="bottom right"
      on="click"
    />
  );
}
