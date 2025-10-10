/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Dimmer, Icon, Loader } from "semantic-ui-react";
import isEqual from "lodash/isEqual";

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
import { Title, Pagination, Search } from "~/components";
import BasePage from "../BasePage";
import Welcome from "./components/Welcome";
import WorkflowFilters from "./components/WorkflowFilters";
import WorkflowList from "./components/WorkflowList";
import styles from "./WorkflowList.module.scss";

const PAGE_SIZE = 5;

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
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const config = useSelector(getConfig);
  const workflows = useSelector(getWorkflows);
  const workflowsCount = useSelector(getWorkflowsCount);
  const hasUserWorkflows = useSelector(userHasWorkflows);
  const workflowRefresh = useSelector(getWorkflowRefresh);
  const loading = useSelector(loadingWorkflows);
  const reanaToken = useSelector(getReanaToken);
  const configLoaded = useSelector(isConfigLoaded);
  const hideWelcomePage = !workflows || !configLoaded;
  const { pollingSecs } = config;

  const page = useMemo(() => {
    const n = parseInt(searchParams.get("page") || "", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);
  const pagination = useMemo(() => ({ page, size: PAGE_SIZE }), [page]);
  const initialSearch = searchParams.get("search") || "";
  const [searchText, setSearchText] = useState(initialSearch);
  const [committedSearch, setCommittedSearch] = useState(initialSearch);

  // Owned by derived from URL
  const ownedByFilter = useMemo(
    () => (searchParams.get("shared") === "true" ? "anybody" : "you"),
    [searchParams],
  );

  // Shared with flag from URL
  const sharedWithMode = useMemo(
    () => searchParams.get("shared-with") === "true",
    [searchParams],
  );

  const [sharedWithFilter, setSharedWithFilter] = useState(() =>
    searchParams.get("shared-with") === "true" ? "anybody" : undefined,
  );
  const showDeletedMode = useMemo(
    () => searchParams.get("show-deleted") === "true",
    [searchParams],
  );

  // Single value Status single value from URL - undefined means all
  const statusFilter = useMemo(
    () => searchParams.get("status") ?? undefined,
    [searchParams],
  );
  const statusExplicit = useMemo(
    () => searchParams.has("status"),
    [searchParams],
  );
  const sortDir = useMemo(
    () => searchParams.get("sort") || "desc",
    [searchParams],
  );

  // URL writers
  const setStatusFilterInUrl = (nextStatus) => {
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        if (nextStatus) qp.set("status", nextStatus);
        else qp.delete("status");
        qp.delete("page");
        return qp;
      },
      { replace: false },
    );
  };
  const setShowDeletedInUrl = (on) => {
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        if (on) qp.set("show-deleted", "true");
        else qp.delete("show-deleted");
        qp.delete("page");
        return qp;
      },
      { replace: false },
    );
  };
  const setSortDirInUrl = (nextSort) => {
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        if (nextSort && nextSort !== "desc") qp.set("sort", nextSort);
        else qp.delete("sort");
        qp.delete("page");
        return qp;
      },
      { replace: false },
    );
  };
  const setOwnedByFilter = (next) => {
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        qp.delete("shared-with"); // ensure shared-with mode is off
        if (next === "anybody") qp.set("shared", "true");
        else qp.delete("shared"); // default is "you"
        qp.delete("page");
        return qp;
      },
      { replace: false },
    );
  };
  const setSharedWithModeInUrl = (on) => {
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        if (on) {
          qp.set("shared-with", "true");
          qp.delete("shared");
        } else {
          qp.delete("shared-with");
        }
        qp.delete("page");
        return qp;
      },
      { replace: false },
    );
  };

  const gotoPage = (nextPage) => {
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        if (nextPage > 1) qp.set("page", String(nextPage));
        else qp.delete("page");
        return qp;
      },
      { replace: false },
    );
  };

  // Keep URL and search box in sync
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    // If URL changed, update textbox and committedSearch
    if (urlSearch !== committedSearch && urlSearch !== searchText) {
      setSearchText(urlSearch);
      setCommittedSearch(urlSearch);
      return;
    }
    if (committedSearch && urlSearch !== committedSearch) {
      setSearchParams(
        (prev) => {
          const qp = new URLSearchParams(prev);
          qp.set("search", committedSearch);
          return qp;
        },
        { replace: false },
      );
    } else if (!committedSearch && urlSearch) {
      setSearchParams(
        (prev) => {
          const qp = new URLSearchParams(prev);
          qp.delete("search");
          return qp;
        },
        { replace: false },
      );
    }
  }, [committedSearch, searchParams, searchText, setSearchParams]);

  // if ?page= param is not in a valid format, or page is 1, remove page from URL
  useEffect(() => {
    const raw = searchParams.get("page");
    const n = parseInt(raw || "", 10);
    const shouldRemovePage =
      searchParams.has("page") &&
      (!raw || // page=empty string
        !Number.isFinite(n) || // page=abc
        n <= 1); // page=1, page=0

    if (shouldRemovePage) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Build API params from URL state
  const requestParams = useMemo(() => {
    // owned-by vs shared-with
    const inSharedWith = sharedWithMode;

    let shared, sharedBy;
    if (!inSharedWith) {
      if (ownedByFilter === "anybody") {
        shared = true;
        sharedBy = null;
      } else if (ownedByFilter && ownedByFilter !== "you") {
        sharedBy = ownedByFilter;
      }
    }

    const sharedWithParam = inSharedWith
      ? sharedWithFilter && sharedWithFilter !== "anybody"
        ? sharedWithFilter
        : true
      : undefined;

    // Status appending
    let statusForApi;
    if (statusExplicit) {
      statusForApi = showDeletedMode
        ? statusFilter === "deleted"
          ? ["deleted"]
          : [statusFilter, "deleted"]
        : [statusFilter];
    } else {
      statusForApi = showDeletedMode ? undefined : NON_DELETED_STATUSES;
    }

    return {
      pagination: { ...pagination },
      search: committedSearch || undefined,
      status: statusForApi,
      shared,
      sharedBy,
      sharedWith: sharedWithParam,
      sort: sortDir,
    };
  }, [
    pagination,
    committedSearch,
    statusFilter,
    statusExplicit,
    showDeletedMode,
    ownedByFilter,
    sharedWithFilter,
    sharedWithMode,
    sortDir,
  ]);

  const lastParamsRef = useRef();
  const rafIdRef = useRef(0);
  useEffect(() => {
    if (!configLoaded || !reanaToken) return;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    const paramsForFrame = requestParams;

    rafIdRef.current = requestAnimationFrame(() => {
      if (!isEqual(lastParamsRef.current, paramsForFrame)) {
        lastParamsRef.current = paramsForFrame;
        dispatch(fetchWorkflows(paramsForFrame));
      }
      rafIdRef.current = 0;
    });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    };
  }, [dispatch, requestParams, configLoaded, reanaToken]);

  const latestParamsRef = useRef(requestParams);
  useEffect(() => {
    latestParamsRef.current = requestParams;
  }, [requestParams]);

  useEffect(() => {
    if (!reanaToken || !pollingSecs || !configLoaded) return;
    const id = setInterval(() => {
      const apiParams = latestParamsRef.current;
      dispatch(fetchWorkflows({ ...apiParams, showLoader: false }));
      setRefreshedAt(currentUTCTime());
    }, pollingSecs * 1000);
    return () => clearInterval(id);
  }, [dispatch, reanaToken, pollingSecs, configLoaded]);

  // External refresh trigger
  useEffect(() => {
    if (!configLoaded || !reanaToken) return;
    if (workflowRefresh === undefined) return;
    const apiParams = latestParamsRef.current;
    dispatch(fetchWorkflows({ ...apiParams, showLoader: false }));
  }, [workflowRefresh, dispatch, configLoaded, reanaToken]);

  // Run search using Enter/Click and go to page 1
  const submitSearch = () => {
    const q = searchText.trim();
    setSearchParams(
      (prev) => {
        const qp = new URLSearchParams(prev);
        if (q) qp.set("search", q);
        else qp.delete("search");
        qp.delete("page");
        return qp;
      },
      { replace: false },
    );
    setCommittedSearch(q);
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

  if (!hasUserWorkflows) return <Welcome />;

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
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilterInUrl}
          showDeleted={showDeletedMode}
          setShowDeleted={setShowDeletedInUrl}
          statusExplicit={statusExplicit}
          ownedByFilter={ownedByFilter}
          setOwnedByFilter={setOwnedByFilter}
          sharedWithFilter={sharedWithFilter}
          sharedWithMode={sharedWithMode}
          setSharedWithFilter={setSharedWithFilter}
          sortDir={sortDir}
          setSortDir={setSortDirInUrl}
          setSharedWithModeInUrl={setSharedWithModeInUrl}
        />
        <WorkflowList workflows={workflowArray} loading={loading} />
      </Container>
      {workflowsCount > PAGE_SIZE && !loading && (
        <Pagination
          className={styles.pagination}
          activePage={page}
          totalPages={Math.ceil(workflowsCount / PAGE_SIZE)}
          onPageChange={(_, { activePage }) => gotoPage(activePage)}
        />
      )}
    </div>
  );
}
