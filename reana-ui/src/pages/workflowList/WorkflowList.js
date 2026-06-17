/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Container, Dimmer, Dropdown, Loader } from "semantic-ui-react";

import {
  fetchUsersSharedWithYou,
  fetchWorkflows,
  workflowListQueryKey,
} from "~/actions";
import {
  getConfig,
  getWorkflows,
  getWorkflowsCount,
  getWorkflowsQueryKey,
  isConfigLoaded,
  loadingWorkflows,
  userHasWorkflows,
  getWorkflowRefresh,
  getUsersSharedWithYou,
} from "~/selectors";
import { Pagination, Search } from "~/components";
import BasePage from "../BasePage";
import Welcome from "./components/Welcome";
import WorkflowCategoryTabs from "./components/WorkflowCategoryTabs";
import WorkflowFilters from "./components/WorkflowFilters";
import WorkflowList from "./components/WorkflowList";
import WorkflowSorting from "./components/WorkflowSorting";
import { useWorkflowContinuationCue } from "./useWorkflowContinuationCue";
import { useWorkflowListQuery } from "./useWorkflowListQuery";
import {
  parseWorkflowListQuery,
  WORKFLOW_CATEGORY_LABELS,
  WORKFLOW_LIST_PAGE_SIZE_OPTIONS,
} from "./workflowListQuery";
import styles from "./WorkflowList.module.scss";

export default function WorkflowListPage() {
  // Parsed directly rather than through `useWorkflowListQuery`, whose URL
  // normalisation should only run once, inside `Workflows`.
  const [searchParams] = useSearchParams();
  const { category } = parseWorkflowListQuery(searchParams);

  return (
    <BasePage title={WORKFLOW_CATEGORY_LABELS[category]}>
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
  const workflowsQueryKey = useSelector(getWorkflowsQueryKey);
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
    clearFilters,
    hasActiveFilters,
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
    category,
  } = query;

  // Load information about users who have shared workflows with you
  useEffect(() => {
    dispatch(fetchUsersSharedWithYou());
  }, [dispatch]);

  // Compared by value, not identity: URL normalisation produces a new
  // `requestParams` object for an unchanged request.
  const requestKey = useMemo(
    () => workflowListQueryKey(requestParams),
    [requestParams],
  );
  const lastParamsRef = useRef();
  useEffect(() => {
    if (!configLoaded) return;
    if (lastParamsRef.current === requestKey) return;
    lastParamsRef.current = requestKey;
    dispatch(fetchWorkflows(requestParams));
  }, [dispatch, requestParams, requestKey, configLoaded]);

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

  // `workflows`/`total` are shared with single-workflow fetches (returning from
  // workflow details leaves `total=1` behind) and with superseded list queries,
  // so the count is only trusted once it belongs to the query on screen.
  const countDescribesCurrentQuery = workflowsQueryKey === requestKey;

  // A page beyond the result set — hand-edited, or left behind when workflows
  // disappear — is replaced by the last page that still has results. The
  // correction replaces the history entry so Back does not return to the
  // invalid page and trigger it again.
  const lastPage = Math.max(1, Math.ceil(workflowsCount / pageSize));
  const isPageOutOfRange =
    countDescribesCurrentQuery && workflowsCount > 0 && page > lastPage;
  useEffect(() => {
    if (loading || !isPageOutOfRange) return;
    setPage(lastPage, { replace: true });
  }, [loading, isPageOutOfRange, lastPage, setPage]);

  const { listEndRef, footerRef, showContinuationCue } =
    useWorkflowContinuationCue({
      workflows,
      workflowsCount,
      page,
      pageSize,
      loading,
    });

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
  const pageSizeOptions = WORKFLOW_LIST_PAGE_SIZE_OPTIONS.some(
    (option) => option.value === pageSize,
  )
    ? WORKFLOW_LIST_PAGE_SIZE_OPTIONS
    : [
        ...WORKFLOW_LIST_PAGE_SIZE_OPTIONS,
        {
          key: pageSize,
          text: `${pageSize}`,
          value: pageSize,
        },
      ].sort((a, b) => a.value - b.value);
  const firstResult = workflowsCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const lastResult =
    workflowsCount > 0 ? Math.min(page * pageSize, workflowsCount) : 0;
  const showPagination =
    countDescribesCurrentQuery && workflowsCount > pageSize;
  const hasVisibleWorkflows = workflowArray.length > 0;

  return (
    <div className={styles.container}>
      <Container text className={styles["workflow-list-container"]}>
        <h1 className={styles.pageHeading}>
          {WORKFLOW_CATEGORY_LABELS[category]}
        </h1>
        <WorkflowCategoryTabs
          category={category}
          setCategory={(nextCategory) =>
            setSharing(
              nextCategory === "shared-with-me" ? "anybody" : undefined,
              undefined,
            )
          }
          refreshedAt={refreshedAt}
          refresh={() => window.location.reload()}
        />
        <div className={styles.browser}>
          <WorkflowFilters
            category={category}
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
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
          />
          <main className={styles.results}>
            <div className={styles.resultsHeader}>
              <div className={styles.search}>
                <Search
                  value={searchText}
                  onChange={setSearchText}
                  onSubmit={submitSearch}
                  placeholder="Search by workflow name..."
                />
              </div>
              <div className={styles.resultControls}>
                <WorkflowSorting value={sort} sort={setSort} />
              </div>
            </div>
            {countDescribesCurrentQuery &&
              workflowsCount > 0 &&
              !isPageOutOfRange && (
                <div className={styles.resultContext}>
                  Showing {firstResult}–{lastResult} of {workflowsCount}{" "}
                  {workflowsCount === 1 ? "workflow" : "workflows"}
                </div>
              )}
            <div className={styles.resultsBody}>
              <div className={styles.workflowListFrame}>
                <WorkflowList
                  workflows={workflowArray}
                  loading={loading}
                  hasActiveFilters={hasActiveFilters}
                  clearFilters={clearFilters}
                />
                {loading && hasVisibleWorkflows && (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.loadingIndicator}>
                      <Loader active inline />
                    </div>
                  </div>
                )}
              </div>
              {loading && !hasVisibleWorkflows && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.loadingIndicator}>
                    <Loader active inline />
                  </div>
                </div>
              )}
              <div ref={listEndRef} aria-hidden="true" />
            </div>
            <div
              ref={footerRef}
              className={`${styles.paginationRow} ${
                showContinuationCue ? styles.paginationRowWithCue : ""
              }`}
            >
              <div
                className={`${styles.paginationSlot} ${
                  showPagination ? "" : styles.paginationSlotEmpty
                }`}
                aria-hidden={!showPagination}
              >
                {showPagination && (
                  <Pagination
                    activePage={Math.min(page, lastPage)}
                    totalPages={lastPage}
                    onPageChange={(_, { activePage }) => setPage(activePage)}
                  />
                )}
              </div>
              <div className={styles.pageSize}>
                <span>Show</span>
                <Dropdown
                  inline
                  aria-label="Results per page"
                  options={pageSizeOptions}
                  value={pageSize}
                  onChange={(_, { value }) => setPageSize(Number(value))}
                />
                <span>per page</span>
              </div>
            </div>
          </main>
        </div>
      </Container>
    </div>
  );
}
