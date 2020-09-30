/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Dimmer, Loader } from "semantic-ui-react";

import { fetchWorkflows } from "../../actions";
import {
  getConfig,
  getReanaToken,
  getWorkflows,
  getWorkflowsCount,
  loadingWorkflows,
  userHasWorkflows,
} from "../../selectors";
import BasePage from "../BasePage";
import { Title } from "../../components";
import Welcome from "./components/Welcome";
import WorkflowList from "./components/WorkflowList";
import { Pagination } from "../../components";

import styles from "./WorkflowList.module.scss";
import WorkflowFilters from "./components/WorkflowFilters";
import WorkflowSearch from "./components/WorkflowSearch";

const PAGE_SIZE = 5;

export default function WorkflowListPage() {
  return (
    <BasePage>
      <Workflows />
    </BasePage>
  );
}

function Workflows() {
  const currentUTCTime = () => moment.utc().format("HH:mm:ss [UTC]");
  const [refreshedAt, setRefreshedAt] = useState(currentUTCTime());
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE });
  const [statusFilter, setStatusFilter] = useState([]);
  const [searchFilter, setSearchFilter] = useState();
  const [sortDir, setSortDir] = useState("desc");
  const dispatch = useDispatch();
  const config = useSelector(getConfig);
  const workflows = useSelector(getWorkflows);
  const workflowsCount = useSelector(getWorkflowsCount);
  const hasUserWorkflows = useSelector(userHasWorkflows);
  const loading = useSelector(loadingWorkflows);
  const reanaToken = useSelector(getReanaToken);
  const interval = useRef(null);

  useEffect(() => {
    dispatch(
      fetchWorkflows({ ...pagination }, searchFilter, statusFilter, sortDir)
    );

    if (!interval.current && reanaToken) {
      interval.current = setInterval(() => {
        dispatch(
          fetchWorkflows({ ...pagination }, searchFilter, statusFilter, sortDir)
        );
        setRefreshedAt(currentUTCTime());
      }, config.poolingSecs * 1000);
    }

    return function cleanup() {
      clearInterval(interval.current);
    };
  }, [
    config.poolingSecs,
    dispatch,
    pagination,
    reanaToken,
    searchFilter,
    statusFilter,
    sortDir,
  ]);

  const applyFilter = (filter) => (value) => {
    unstable_batchedUpdates(() => {
      filter(value);
      setPagination({ ...pagination, page: 1 });
    });
  };

  if (!workflows) {
    return (
      loading && (
        <Dimmer active inverted>
          <Loader>Loading workflows...</Loader>
        </Dimmer>
      )
    );
  }

  if (!hasUserWorkflows) {
    return <Welcome />;
  }

  //TODO: workflows should be flattened in the redux to avoid doing it on every render
  const workflowArray = Object.entries(workflows).map(
    ([_, workflow]) => workflow
  );

  return (
    <div className={styles.container}>
      <Container text>
        <Title className={styles.title}>
          <span>Your workflows</span>
          <span className={styles.refresh}>Refreshed at {refreshedAt}</span>
        </Title>
        <WorkflowSearch search={applyFilter(setSearchFilter)} />
        <WorkflowFilters
          statusFilter={statusFilter}
          setStatusFilter={applyFilter(setStatusFilter)}
          sortDir={sortDir}
          setSortDir={applyFilter(setSortDir)}
        />
        <WorkflowList workflows={workflowArray} loading={loading} />
      </Container>
      {workflowsCount > PAGE_SIZE && !loading && (
        <Pagination
          className={styles.pagination}
          activePage={pagination.page}
          totalPages={Math.ceil(workflowsCount / PAGE_SIZE)}
          onPageChange={(_, { activePage }) => {
            clearInterval(interval.current);
            interval.current = null;
            setPagination({ ...pagination, page: activePage });
          }}
        />
      )}
    </div>
  );
}
