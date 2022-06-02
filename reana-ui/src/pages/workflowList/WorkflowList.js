/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Dimmer, Icon, Loader } from "semantic-ui-react";

import { fetchWorkflows } from "~/actions";
import {
  getConfig,
  getReanaToken,
  getWorkflows,
  getWorkflowsCount,
  isConfigLoaded,
  loadingWorkflows,
  userHasWorkflows,
  getWorkflowRefresh,
} from "~/selectors";
import { NON_DELETED_STATUSES } from "~/config";
import { Title } from "~/components";
import { Pagination, Search } from "~/components";
import { applyFilter } from "~/components/Search";
import BasePage from "../BasePage";
import Welcome from "./components/Welcome";
import WorkflowFilters from "./components/WorkflowFilters";
import WorkflowList from "./components/WorkflowList";

import styles from "./WorkflowList.module.scss";

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
  const [statusFilter, setStatusFilter] = useState(NON_DELETED_STATUSES);
  const [searchFilter, setSearchFilter] = useState();
  const [sortDir, setSortDir] = useState("desc");
  const dispatch = useDispatch();
  const config = useSelector(getConfig);
  const workflows = useSelector(getWorkflows);
  const workflowsCount = useSelector(getWorkflowsCount);
  const hasUserWorkflows = useSelector(userHasWorkflows);
  const workflowRefresh = useSelector(getWorkflowRefresh);
  const loading = useSelector(loadingWorkflows);
  const reanaToken = useSelector(getReanaToken);
  const configLoaded = useSelector(isConfigLoaded);
  const interval = useRef(null);
  const hideWelcomePage = !workflows || !configLoaded;
  const { pollingSecs } = config;

  // FIXME: workflowRefresh is a temporary solution to refresh workflow list
  // by saving random number in redux. It should be refactored in the future
  // once websockets will be implemented
  useEffect(() => cleanPolling(), [workflowRefresh]);

  useEffect(() => {
    dispatch(
      fetchWorkflows({
        pagination: { ...pagination },
        search: searchFilter,
        status: statusFilter,
        sort: sortDir,
      })
    );

    if (!interval.current && reanaToken && pollingSecs) {
      interval.current = setInterval(() => {
        const showLoader = false;
        dispatch(
          fetchWorkflows({
            pagination: { ...pagination },
            search: searchFilter,
            status: statusFilter,
            sort: sortDir,
            showLoader,
          })
        );
        setRefreshedAt(currentUTCTime());
      }, pollingSecs * 1000);
    }
    return cleanPolling;
  }, [
    pollingSecs,
    dispatch,
    pagination,
    reanaToken,
    searchFilter,
    statusFilter,
    sortDir,
    workflowRefresh,
  ]);

  const cleanPolling = () => {
    clearInterval(interval.current);
    interval.current = null;
  };

  if (hideWelcomePage) {
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
          <span className={styles.refresh}>
            <Icon
              name="refresh"
              className={styles.icon}
              onClick={() => window.location.reload()}
            />
            Refreshed at {refreshedAt}
          </span>
        </Title>
        <Search
          search={applyFilter(setSearchFilter, pagination, setPagination)}
        />
        <WorkflowFilters
          statusFilter={statusFilter}
          setStatusFilter={applyFilter(
            setStatusFilter,
            pagination,
            setPagination
          )}
          sortDir={sortDir}
          setSortDir={applyFilter(setSortDir, pagination, setPagination)}
        />
        <WorkflowList workflows={workflowArray} loading={loading} />
      </Container>
      {workflowsCount > PAGE_SIZE && !loading && (
        <Pagination
          className={styles.pagination}
          activePage={pagination.page}
          totalPages={Math.ceil(workflowsCount / PAGE_SIZE)}
          onPageChange={(_, { activePage }) => {
            cleanPolling();
            setPagination({ ...pagination, page: activePage });
          }}
        />
      )}
    </div>
  );
}
