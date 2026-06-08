/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Container, Grid, Label, Loader, Message } from "semantic-ui-react";

import BasePage from "../BasePage";
import { Title, PieChart } from "~/components";
import { healthMapping } from "~/util";
import { useStatus, useInfo } from "~/api/hooks";

import styles from "./Status.module.scss";

const statusColorMapping = {
  available: "#9dd9b8", // light green
  running: "#36a165", // green
  pending: "#e5975e", // orange
  unschedulable: "#e55e5e", // red
};

const getDataSeries = (
  values: Record<string, number>,
): Array<{ title: string; value: number; color: string }> =>
  Object.entries(values).map(([title, value]) => ({
    title,
    value,
    color: statusColorMapping[title],
  }));

export function getStatusErrorMessage(error: unknown): string {
  return (
    (error as any)?.response?.data?.message ||
    (error as any)?.message ||
    "Could not load cluster status."
  );
}

export default function Status() {
  const { data: status, error, isError, isLoading } = useStatus();
  // access_token is optional in practice — session auth handles authorization
  const { data: infoData } = useInfo({ access_token: "" });
  const jobsMemoryLimit: string | null =
    infoData?.default_kubernetes_memory_limit?.value ?? null;

  const serialize: any = {
    node: ({ available, unschedulable, ...rest }) => {
      return {
        title: "Nodes",
        details: [`${available} available`, `${unschedulable} unschedulable`],
        data: getDataSeries({
          unschedulable,
          // display as running color if there are workflows running
          [!!status?.workflow?.running ? "running" : "queued"]: available,
        }),
        ...rest,
      };
    },
    workflow: ({ running, pending, queued, available, ...rest }) => ({
      title: "Workflows",
      details: [
        `${running} running`,
        `${pending} pending`,
        `${available} available`,
        <span
          className={queued > 0 ? styles.highlight : ""}
        >{`${queued} queued`}</span>,
      ],
      data: getDataSeries({ running, pending, available }),
      ...rest,
    }),
    job: ({ running, pending, available, ...rest }) => ({
      title: "Jobs",
      details: [
        `${running} running`,
        `${pending} pending`,
        `${available} available*`,
      ],
      data: getDataSeries({ running, pending, available }),
      ...rest,
      footnote: `* assuming that jobs ask for ${jobsMemoryLimit || "4Gi"} of memory`,
    }),
    session: ({ active, ...rest }) => ({
      title: "Notebooks",
      details: [`${active} active`],
      data: [{ value: active, color: statusColorMapping["running"] }],
      total: active,
      ...rest,
    }),
  };

  const renderPieChart = (props: any): React.ReactElement => {
    const { title, details, data, total, footnote, percentage, health } = props;
    return (
      <Grid.Column className={styles.column} key={title}>
        <div className={styles.cardMain}>
          <PieChart
            data={data}
            value={percentage}
            totalValue={total || 100}
            backgroundColor={statusColorMapping.available}
          />

          <div className={styles["status-details"]}>
            <div className={styles.usage}>
              <h3>{title}</h3>
              {details.map((detail, index) => (
                <div key={`${title}-${index}`}>{detail}</div>
              ))}
            </div>

            {percentage !== undefined && (
              <Label
                basic
                size="small"
                color={healthMapping[health] as any}
                className={styles.percentage}
              >
                {percentage || 0}%
              </Label>
            )}
          </div>
        </div>
        {footnote && <div className={styles.footnote}>{footnote}</div>}
      </Grid.Column>
    );
  };

  return (
    <BasePage title="Cluster health">
      <Container text className={styles.container}>
        <Title>Cluster health</Title>
        {isLoading ? (
          <Loader active inline="centered">
            Loading cluster status...
          </Loader>
        ) : isError || !status ? (
          <Message
            error
            icon="warning sign"
            header="An error has occurred"
            content={getStatusErrorMessage(error)}
          />
        ) : (
          <>
            <Grid columns={2}>
              {Object.entries(status)
                .sort(([, a], [, b]) => (a as any).sort - (b as any).sort)
                .filter(([title]) => serialize[title])
                .map(([title, status]) =>
                  renderPieChart(serialize[title](status)),
                )}
            </Grid>
          </>
        )}
      </Container>
    </BasePage>
  );
}
