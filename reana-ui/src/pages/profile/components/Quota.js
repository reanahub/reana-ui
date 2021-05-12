/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";
import { Grid, Label } from "semantic-ui-react";
import isEmpty from "lodash/isEmpty";

import { PieChart } from "~/components";
import { getUserQuota } from "~/selectors";
import { healthMapping } from "~/util";

import styles from "./Quota.module.scss";

export default function Quota() {
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
    <Grid columns={2}>
      {renderPieChart("CPU", quota.cpu)}
      {renderPieChart("HDD", quota.disk)}
    </Grid>
  );
}
