/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Dimmer, Dropdown, Icon, Loader } from "semantic-ui-react";

import { fetchUsersSharedWithYou, fetchWorkflows } from "~/actions";
import {
  getConfig,
  getWorkflows,
  getWorkflowsCount,
  isConfigLoaded,
  loadingWorkflows,
  userHasWorkflows,
  getWorkflowRefresh,
  getUsersSharedWithYou,
} from "~/selectors";
import { Title, Pagination, Search } from "~/components";
import BasePage from "../BasePage";
import Welcome from "./components/Welcome";
import WorkflowFilters from "./components/WorkflowFilters";
import WorkflowList from "./components/WorkflowList";
import { useWorkflowListQuery } from "./useWorkflowListQuery";
import { WORKFLOW_LIST_PAGE_SIZE_OPTIONS } from "./workflowListQuery";
import styles from "./WorkflowList.module.scss";

export default function WorkflowListPage() {
  return (
    <BasePage title="Your workflows">
      <Workflows />
    </BasePage>
  );
}

function Workflows() {
  const currentUTCTime = () => moment.utc().format("HH:mm:ss [UTC]");
  const [refreshedAt, setRefreshedAt] = useState(currentUTCTime());
  const dispatch = useDispatch();
  const config = useSelector(getConfig);
  const workflows = useSelector(getWorkflows);
  const workflowsCount = useSelector(getWorkflowsCount);
  const hasUserWorkflows = useSelector(userHasWorkflows);
  const usersSharedWithYou = useSelector(getUsersSharedWithYou);
  const workflowRefresh = useSelector(getWorkflowRefresh);
  const loading = useSelector(loadingWorkflows);
  const configLoaded = useSelector(isConfigLoaded);
  const hideWelcomePage = !workflows || !configLoaded;
  const { pollingSecs } = config;
  const {
    query,
    requestParams,
    searchText,
    setSearchText,
    submitSearch,
    setPage,
    setPageSize,
    setStatus,
    setIncludeDeleted,
    setSort,
    setShowOpenSessionsOnly,
    setSharing,
  } = useWorkflowListQuery();
  const {
    page,
    pageSize,
    status,
    hasStatusFilter,
    includeDeleted,
    sort,
    showOpenSessionsOnly,
    ownedBy,
    sharedWith,
  } = query;

  // Load information about users who have shared workflows with you
  useEffect(() => {
    dispatch(fetchUsersSharedWithYou());
  }, [dispatch]);

  const lastParamsRef = useRef();
  useEffect(() => {
    if (!configLoaded) return;
    if (lastParamsRef.current === requestParams) return;
    lastParamsRef.current = requestParams;
    dispatch(fetchWorkflows(requestParams));
  }, [dispatch, requestParams, configLoaded]);

  const latestParamsRef = useRef(requestParams);
  useEffect(() => {
    latestParamsRef.current = requestParams;
  }, [requestParams]);

  useEffect(() => {
    if (!pollingSecs || !configLoaded) return;
    const id = setInterval(() => {
      const apiParams = latestParamsRef.current;
      dispatch(fetchWorkflows({ ...apiParams, showLoader: false }));
      setRefreshedAt(currentUTCTime());
    }, pollingSecs * 1000);
    return () => clearInterval(id);
  }, [dispatch, pollingSecs, configLoaded]);

  // External refresh trigger
  useEffect(() => {
    if (!configLoaded) return;
    if (workflowRefresh === undefined) return;
    const apiParams = latestParamsRef.current;
    dispatch(fetchWorkflows({ ...apiParams, showLoader: false }));
  }, [workflowRefresh, dispatch, configLoaded]);

  if (hideWelcomePage) {
    return (
      loading && (
        <Dimmer active inverted>
          <Loader>Loading workflows...</Loader>
        </Dimmer>
      )
    );
  }

  if (!hasUserWorkflows && usersSharedWithYou.length === 0) {
    return <Welcome />;
  }

  // Flatten workflows object to array for rendering
  const workflowArray = Object.values(workflows || {});

  return (
    <div className={styles.container}>
      <Container text className={styles["workflow-list-container"]}>
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
          value={searchText}
          onChange={setSearchText}
          onSubmit={submitSearch}
        />
        <WorkflowFilters
          ownedBy={ownedBy}
          sharedWith={sharedWith}
          setSharing={setSharing}
          statusFilter={status}
          setStatusFilter={setStatus}
          includeDeleted={includeDeleted}
          setIncludeDeleted={setIncludeDeleted}
          hasStatusFilter={hasStatusFilter}
          showOpenSessionsOnly={showOpenSessionsOnly}
          setShowOpenSessionsOnly={setShowOpenSessionsOnly}
          sortDir={sort}
          setSortDir={setSort}
        />
        <WorkflowList workflows={workflowArray} loading={loading} />
        {!loading && (
          <div className={styles.paginationRow}>
            {/* To emulate size of page-size dropdown and ensure page buttons stay in middle of screen */}
            <div className={styles.pageSizeNotVisible}>
              <span className={styles.pageSizeLabel}>Results per page:</span>
              <Dropdown
                selection
                compact
                options={WORKFLOW_LIST_PAGE_SIZE_OPTIONS}
                value={pageSize}
              />
            </div>
            {workflowsCount > pageSize && (
              <Pagination
                className={styles.pagination}
                activePage={page}
                totalPages={Math.ceil(workflowsCount / pageSize)}
                onPageChange={(_, { activePage }) => setPage(activePage)}
              />
            )}
            <div className={styles.pageSize}>
              <span className={styles.pageSizeLabel}>Results per page:</span>
              <Dropdown
                selection
                compact
                options={
                  WORKFLOW_LIST_PAGE_SIZE_OPTIONS.some(
                    (o) => o.value === pageSize,
                  )
                    ? WORKFLOW_LIST_PAGE_SIZE_OPTIONS
                    : [
                        ...WORKFLOW_LIST_PAGE_SIZE_OPTIONS,
                        {
                          key: pageSize,
                          text: String(pageSize),
                          value: pageSize,
                        },
                      ].sort((a, b) => a.value - b.value)
                }
                value={pageSize}
                onChange={(_, { value }) => {
                  const newSize = Number(value);
                  setPageSize(newSize);
                }}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
