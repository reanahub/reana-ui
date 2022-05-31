/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { Grid, Label } from "semantic-ui-react";
import isEmpty from "lodash/isEmpty";

import { PieChart, Notification } from "~/components";
import { REANA_QUOTAS_DOCS_URL } from "~/config";
import { getConfig, getUserQuota } from "~/selectors";
import { healthMapping } from "~/util";

import styles from "./Quota.module.scss";

export default function Quota() {
  const config = useSelector(getConfig);
  const quota = useSelector(getUserQuota);

  function renderPieChart(title, quota) {
    const { usage, limit, health } = quota;
    const percentage = Math.round((usage?.raw / limit?.raw) * 100);
    const hasLimit = limit?.raw > 0;

    return (
      !isEmpty(quota) && (
        <Grid.Column className={styles.column}>
          <PieChart
            title={title}
            value={hasLimit ? usage.raw : 0}
            totalValue={limit?.raw}
          />
          <div className={styles["quota-details"]}>
            <div className={styles.usage}>
              <h3>{usage.human_readable}</h3>
              {hasLimit ? `out of ${limit.human_readable} ` : "used"}
            </div>
            {hasLimit && (
              <Label
                basic
                size="small"
                color={healthMapping[health]}
                className={styles.percentage}
              >
                used {percentage}%
              </Label>
            )}
          </div>
        </Grid.Column>
      )
    );
  }
  return (
    <>
      <Grid columns={2}>
        {renderPieChart("CPU", quota.cpu)}
        {renderPieChart("Disk", quota.disk)}
      </Grid>
      <div className={styles["quota-info"]}>
        {getQuotaNotifications(quota, config.adminEmail).map(
          (notification, index) => {
            const message = (
              <span>
                {notification.body} For more details, please check out the
                related{" "}
                <a
                  href={REANA_QUOTAS_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentation page
                </a>
                .
              </span>
            );
            return (
              <div key={index}>
                <Notification
                  icon={notification.icon}
                  header={notification.header}
                  message={message}
                  error={notification.type === "error"}
                  warning={notification.type === "warning"}
                  closable={false}
                />
              </div>
            );
          }
        )}
      </div>
    </>
  );
}

function getQuotaNotificationInfo(quotaType, exceededLimit, adminEmail) {
  if (quotaType === "disk" && exceededLimit)
    return "Please delete unnecessary workflow runs.";
  if (quotaType === "disk" && !exceededLimit)
    return "Please consider liberating disk space by deleting some workflow runs.";
  if (quotaType === "cpu" && exceededLimit)
    return (
      <span>
        Please contact the{" "}
        {adminEmail ? (
          <a href={`mailto:${adminEmail}`}>REANA administrators</a>
        ) : (
          "REANA administrators"
        )}{" "}
        for a quota limit increase.
      </span>
    );
}

export function getQuotaNotifications(quota, adminEmail = null) {
  let notifications = [];
  for (const [key, value] of Object.entries(quota)) {
    const { usage, limit, health } = value;
    if (health !== "critical" && health !== "warning") continue;
    const percentage = Math.round((usage?.raw / limit?.raw) * 100);
    const exceededLimit = percentage >= 100;
    const title = key === "disk" ? "Disk" : "CPU";
    notifications.push({
      header: exceededLimit ? `${title} quota exceeded` : `High ${title} usage`,
      icon: exceededLimit ? "warning sign" : "warning circle",
      type: exceededLimit ? "error" : "warning",
      link: "/profile",
      body: (
        <span>
          You've used {percentage || "N/A"}% of your {title} quota.{" "}
          {getQuotaNotificationInfo(key, exceededLimit, adminEmail)}
        </span>
      ),
    });
  }
  return notifications;
}
