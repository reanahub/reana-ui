/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021, 2022, 2023, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Grid, Icon, Label, Loader, Popup } from "semantic-ui-react";

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
        setJobsMemoryLimit(raw);
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
    workflow: ({
      running,
      pending,
      queued,
      backends,
      bottleneck,
      used,
      available,
      ...rest
    }) => {
      // Concurrency is capped independently per compute backend (and per Dask
      // cluster), so the tile reflects the most-constrained backend
      // ("bottleneck"), which matches the scheduler's admission decision. Only
      // the bottleneck is shown inline to keep the tile compact as backends
      // grow; the full per-backend slot usage is available on hover. Older
      // servers without per-backend data fall back to the previous
      // single-counter view.
      const hasBackends = backends && Object.keys(backends).length > 0;
      let backendDetails;
      let percentageTooltip;
      if (hasBackends) {
        const bottleneckName =
          bottleneck in backends ? bottleneck : Object.keys(backends)[0];
        const bottleneckBackend = backends[bottleneckName];
        // Availability (free headroom), to match the percentage badge the
        // tooltip sits next to rather than showing usage.
        const availabilityPercentage = ({ used, total }) =>
          total > 0 ? Math.round(((total - used) / total) * 100) : 0;
        backendDetails = [
          <span key="bottleneck" className={styles.bottleneck}>
            <span className={styles.highlight}>
              {`${bottleneckBackend.used}/${bottleneckBackend.total} ${bottleneckName}`}
            </span>
            {Object.keys(backends).length > 1 && (
              <Popup
                position="top center"
                size="small"
                trigger={
                  <Icon name="info circle" className={styles.backendsInfo} />
                }
                content={
                  <div className={styles.backendsTooltip}>
                    <strong>Slots used per backend</strong>
                    {Object.entries(backends).map(([name, backend]) => (
                      <div
                        key={name}
                        className={
                          name === bottleneckName ? styles.highlight : ""
                        }
                      >
                        {`${backend.used}/${backend.total} ${name}`}
                      </div>
                    ))}
                  </div>
                }
              />
            )}
          </span>,
        ];
        // The percentage badge shows the bottleneck's availability; the tooltip
        // breaks down every backend's availability so it can be seen in context.
        percentageTooltip = (
          <div className={styles.backendsTooltip}>
            <strong>Availability per backend</strong>
            {Object.entries(backends).map(([name, backend]) => (
              <div
                key={name}
                className={name === bottleneckName ? styles.highlight : ""}
              >
                {`${availabilityPercentage(backend)}% ${name}`}
              </div>
            ))}
          </div>
        );
      } else {
        backendDetails = [`${available} available`];
      }
      return {
        title: "Workflows",
        details: [
          `${running} running`,
          `${pending} pending`,
          <span
            className={queued > 0 ? styles.highlight : ""}
          >{`${queued} queued`}</span>,
          ...backendDetails,
        ],
        percentageTooltip,
        // The chart shows the most-constrained backend's slot occupancy
        // (used vs available), so it is consistent with the cap it is measured
        // against.
        data: hasBackends
          ? [
              { title: "used", value: used, color: statusColorMapping.running },
              {
                title: "available",
                value: available,
                color: statusColorMapping.available,
              },
            ]
          : getDataSeries({ running, pending, available }),
        ...rest,
      };
    },
    job: ({ running, pending, available, ...rest }) => ({
      title: "Jobs",
      details: [
        `${running} running`,
        `${pending} pending`,
        `${available} available*`,
      ],
      data: getDataSeries({ running, pending, available }),
      ...rest,
      footnote: `* assuming that jobs ask for ${
        jobsMemoryLimit || "4Gi"
      } of memory`,
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
    footnote,
    percentage,
    percentageTooltip,
    health,
  }) => {
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
              <div className={styles.percentage}>
                <Label basic size="small" color={healthMapping[health]}>
                  {percentage || 0}%
                </Label>
                {percentageTooltip && (
                  <Popup
                    position="top center"
                    size="small"
                    trigger={
                      <Icon
                        name="info circle"
                        className={styles.percentageInfo}
                      />
                    }
                    content={percentageTooltip}
                  />
                )}
              </div>
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
        {loading || !status ? (
          <Loader active inline="centered">
            Loading cluster status...
          </Loader>
        ) : (
          <>
            <Grid columns={2}>
              {Object.entries(status)
                .sort(([, a], [, b]) => a.sort - b.sort)
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
