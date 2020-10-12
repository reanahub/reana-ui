/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { useSelector } from "react-redux";
import { PieChart } from "react-minimal-pie-chart";
import { Grid, Label } from "semantic-ui-react";

import { getUserQuota } from "~/selectors";
import { formatDuration, formatBytes } from "~/util";

import styles from "./Quota.module.scss";

const SEPIA_COLOR = "#f5ecec";
const DARK_SEPIA_COLOR = "#b68181";

export default function Quota() {
  const quota = useSelector(getUserQuota);

  function renderPieChart(title, quota, format) {
    const { usage, limit, health } = quota;
    const percentage = Math.round((usage / limit) * 100);
    const hasLimit = limit > 0;
    const quotaHealthMapping = {
      healthy: "green",
      warning: "orange",
      critical: "red",
    };

    return (
      <Grid.Column className={styles.column}>
        <PieChart
          data={[
            {
              title: title,
              value: hasLimit ? usage : 0,
              color: DARK_SEPIA_COLOR,
            },
          ]}
          lineWidth={30}
          background={SEPIA_COLOR}
          totalValue={limit}
          startAngle={270}
          style={{ height: "150px", flexBasis: "200px" }}
          label={() => title}
          labelStyle={{
            fontSize: "14px",
            fill: DARK_SEPIA_COLOR,
          }}
          labelPosition={0}
        />
        <div className={styles["quota-details"]}>
          <div className={styles.usage}>
            <h3>{format(usage)}</h3>
            {hasLimit ? `out of ${format(limit)} ` : "used"}
          </div>
          {hasLimit && (
            <Label
              basic
              size="small"
              color={quotaHealthMapping[health]}
              className={styles.percentage}
            >
              used {percentage}%
            </Label>
          )}
        </div>
      </Grid.Column>
    );
  }
  return (
    <Grid columns={2}>
      {renderPieChart("CPU", quota.cpu, formatDuration)}
      {renderPieChart("HDD", quota.disk, formatBytes)}
    </Grid>
  );
}
