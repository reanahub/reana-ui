/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { PieChart } from "react-minimal-pie-chart";
import { Grid, Label } from "semantic-ui-react";
import isEmpty from "lodash/isEmpty";

import { getUserQuota } from "~/selectors";

import styles from "./Quota.module.scss";

const SEPIA_COLOR = "#f5ecec";
const DARK_SEPIA_COLOR = "#b68181";

export default function Quota() {
  const quota = useSelector(getUserQuota);

  function renderPieChart(title, quota) {
    const { usage, limit, health } = quota;
    const percentage = Math.round((usage?.raw / limit?.raw) * 100);
    const hasLimit = limit?.raw > 0;
    const quotaHealthMapping = {
      healthy: "green",
      warning: "orange",
      critical: "red",
    };

    return (
      !isEmpty(quota) && (
        <Grid.Column className={styles.column}>
          <PieChart
            data={[
              {
                title: title,
                value: hasLimit ? usage.raw : 0,
                color: DARK_SEPIA_COLOR,
              },
            ]}
            lineWidth={30}
            background={SEPIA_COLOR}
            totalValue={limit?.raw}
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
              <h3>{usage.human_readable}</h3>
              {hasLimit ? `out of ${limit.human_readable} ` : "used"}
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
      )
    );
  }
  return (
    <Grid columns={2}>
      {renderPieChart("CPU", quota.cpu)}
      {renderPieChart("HDD", quota.disk)}
    </Grid>
  );
}
