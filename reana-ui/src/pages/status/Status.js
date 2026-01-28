/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Grid, Label, Loader } from "semantic-ui-react";

import BasePage from "../BasePage";
import { errorActionCreator } from "~/actions";
import client from "~/client";
import { Title, PieChart } from "~/components";
import { healthMapping } from "~/util";

import styles from "./Status.module.scss";

const statusColorMapping = {
  available: "#9dd9b8", // light green
  running: "#36a165", // green
  pending: "#e5975e", // orange
  unschedulable: "#e55e5e", // red
};

const formatGiB = (raw) => {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  // matches common kubernetes style like: "3Gi"
  const m = s.match(/^(\d+(?:\.\d+)?)\s*Gi$/i);
  if (m) return `${m[1]} GiB`;
  return s;
};

const getDataSeries = (values) =>
  Object.entries(values).map(([title, value]) => ({
    title,
    value,
    color: statusColorMapping[title],
  }));

export default function Status() {
  const [status, setStatus] = useState();
  const [loading, setLoading] = useState(false);
  const [jobsMemoryLimit, setJobsMemoryLimit] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const getClusterStatus = () => {
      setLoading(true);
      client
        .getClusterStatus()
        .then((res) => {
          setStatus(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setStatus({});
          setLoading(false);
          dispatch(errorActionCreator(err));
        });
    };

    getClusterStatus();
  }, [dispatch]);

  useEffect(() => {
    client
      .getClusterInfo()
      .then((res) => {
        const raw = res?.data?.default_kubernetes_memory_limit?.value;
        setJobsMemoryLimit(formatGiB(raw));
      })
      .catch(() => setJobsMemoryLimit(null));
  }, []);

  const serialize = {
    node: ({ available, unschedulable, ...rest }) => {
      return {
        title: "Nodes",
        details: [`${available} available`, `${unschedulable} unschedulable`],
        data: getDataSeries({
          unschedulable,
          // display as running color if there are workflows running
          [!!status.workflow.running ? "running" : "queued"]: available,
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
    }),
    session: ({ active, ...rest }) => ({
      title: "Notebooks",
      details: [`${active} active`],
      data: [{ value: active, color: statusColorMapping["running"] }],
      total: active,
      ...rest,
    }),
  };

  const renderPieChart = ({
    title,
    details,
    data,
    total,
    percentage,
    health,
  }) => {
    return (
      <Grid.Column className={styles.column} key={title}>
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
              color={healthMapping[health]}
              className={styles.percentage}
            >
              {percentage || 0}%
            </Label>
          )}
        </div>
      </Grid.Column>
    );
  };

  return (
    <BasePage title="Cluster health">
      <Container text className={styles.container}>
        <Title>Cluster health</Title>
        {loading || !status ? (
          <Loader active inline="centered">
            Loading cluster status...
          </Loader>
        ) : (
          <>
            <Grid columns={2}>
              {Object.entries(status)
                .sort(([, a], [, b]) => a.sort > b.sort)
                .map(([title, status]) =>
                  renderPieChart(serialize[title](status)),
                )}
            </Grid>
            {status?.job && (
              <div
                style={{ marginTop: "2rem", fontSize: "0.8em", opacity: 0.8 }}
              >
                * = assuming the jobs ask for {jobsMemoryLimit || " 3 GiB "} of
                memory (where {jobsMemoryLimit || " 3 GiB "} is taken from
                kubernetes_jobs_memory_limit helm value).
              </div>
            )}
          </>
        )}
      </Container>
    </BasePage>
  );
}
