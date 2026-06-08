/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  serializeQueryToApiParams,
  WORKFLOW_LIST_DEFAULT_PAGE_SIZE,
  WORKFLOW_LIST_CATEGORIES,
  WORKFLOW_LIST_DEFAULT_CATEGORY,
  parseWorkflowListQuery,
} from "./workflowListQuery";

const resetPage = (queryParams: URLSearchParams): void => {
  queryParams.delete("page");
};

const updateParams = (
  setSearchParams: (
    mutator: (prev: URLSearchParams) => URLSearchParams,
    options?: any,
  ) => void,
  mutator: (next: URLSearchParams) => void,
  options?: any,
): void => {
  setSearchParams((previous) => {
    const next = new URLSearchParams(previous);
    mutator(next);
    return next;
  }, options);
};

export function useWorkflowListQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(
    () => parseWorkflowListQuery(searchParams),
    [searchParams],
  );
  const [searchText, setSearchText] = useState(query.search);

  useEffect(() => {
    setSearchText(query.search);
  }, [query.search]);

  useEffect(() => {
    const rawPage = searchParams.get("page");
    const page = Number.parseInt(rawPage || "", 10);
    const shouldRemovePage =
      searchParams.has("page") &&
      (!rawPage || !Number.isFinite(page) || page <= 1);

    if (shouldRemovePage) {
      updateParams(setSearchParams, resetPage, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get("status") === "deleted") {
      updateParams(
        setSearchParams,
        (next) => {
          next.delete("status");
          resetPage(next);
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const submitSearch = useCallback(() => {
    const nextSearch = searchText.trim();
    updateParams(setSearchParams, (next) => {
      if (nextSearch) {
        next.set("search", nextSearch);
      } else {
        next.delete("search");
      }
      resetPage(next);
    });
  }, [searchText, setSearchParams]);

  const setPage = useCallback(
    (nextPage: number) => {
      updateParams(setSearchParams, (next) => {
        if (nextPage > 1) {
          next.set("page", String(nextPage));
        } else {
          next.delete("page");
        }
      });
    },
    [setSearchParams],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      updateParams(setSearchParams, (next) => {
        if (nextPageSize && nextPageSize !== WORKFLOW_LIST_DEFAULT_PAGE_SIZE) {
          next.set("page-size", String(nextPageSize));
        } else {
          next.delete("page-size");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setStatus = useCallback(
    (nextStatus: string) => {
      updateParams(setSearchParams, (next) => {
        if (nextStatus) {
          next.set("status", nextStatus);
        } else {
          next.delete("status");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setIncludeDeleted = useCallback(
    (on: boolean) => {
      updateParams(setSearchParams, (next) => {
        if (on) {
          next.set("show-deleted", "true");
        } else {
          next.delete("show-deleted");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (nextSort: string) => {
      updateParams(setSearchParams, (next) => {
        if (nextSort && nextSort !== "desc") {
          next.set("sort", nextSort);
        } else {
          next.delete("sort");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setShowOpenSessionsOnly = useCallback(
    (on: boolean) => {
      updateParams(setSearchParams, (next) => {
        if (on) {
          next.set("open-sessions", "true");
        } else {
          next.delete("open-sessions");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setCategory = useCallback(
    (nextCategory: string) => {
      updateParams(setSearchParams, (next) => {
        if (
          !WORKFLOW_LIST_CATEGORIES.includes(nextCategory) ||
          nextCategory === WORKFLOW_LIST_DEFAULT_CATEGORY
        ) {
          next.delete("category");
        } else {
          next.set("category", nextCategory);
        }
        // Clear all sharing user filters when switching categories
        next.delete("shared-by");
        next.delete("shared-with-user");
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setSharedByUser = useCallback(
    (email: string) => {
      updateParams(setSearchParams, (next) => {
        if (email && email !== "anybody") {
          next.set("shared-by", email);
        } else {
          next.delete("shared-by");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const setSharedWithUser = useCallback(
    (email: string) => {
      updateParams(setSearchParams, (next) => {
        if (email && email !== "anybody") {
          next.set("shared-with-user", email);
        } else {
          next.delete("shared-with-user");
        }
        resetPage(next);
      });
    },
    [setSearchParams],
  );

  const requestParams = useMemo(
    () => serializeQueryToApiParams(query),
    [query],
  );

  return {
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
    setCategory,
    setSharedByUser,
    setSharedWithUser,
  };
}
