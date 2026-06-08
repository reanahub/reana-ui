/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useMemo } from "react";
import { Dropdown, Grid } from "semantic-ui-react";

import {
  useGetUsersSharedWithYou,
  useGetUsersYouSharedWith,
} from "~/api/hooks";
import WorkflowCategoryFilter from "./WorkflowCategoryTabs";
import WorkflowStatusFilter from "./WorkflowStatusFilter";
import WorkflowSessionFilters from "./WorkflowSessionFilters";
import WorkflowSorting from "./WorkflowSorting";
import styles from "./WorkflowFilters.module.scss";

type Category = "all" | "mine" | "shared-with-me" | "i-shared";

interface WorkflowFiltersProps {
  category: Category;
  setCategory: (category: Category) => void;
  statusFilter?: string;
  setStatusFilter: (status: string | undefined) => void;
  includeDeleted: boolean;
  setIncludeDeleted: (value: boolean) => void;
  hasStatusFilter: boolean;
  sortDir: string;
  setSortDir: (sort: string) => void;
  sharedByUser?: string;
  setSharedByUser: (user: string) => void;
  sharedWithUser?: string;
  setSharedWithUser: (user: string) => void;
  showOpenSessionsOnly: boolean;
  setShowOpenSessionsOnly: (value: boolean) => void;
}

export default function WorkflowFilters({
  category,
  setCategory,
  statusFilter,
  setStatusFilter,
  includeDeleted,
  setIncludeDeleted,
  hasStatusFilter,
  sortDir,
  setSortDir,
  sharedByUser,
  setSharedByUser,
  sharedWithUser,
  setSharedWithUser,
  showOpenSessionsOnly,
  setShowOpenSessionsOnly,
}: WorkflowFiltersProps) {
  const { data: sharedWithYouData } = useGetUsersSharedWithYou();
  const usersSharedWithYou = sharedWithYouData?.users ?? [];
  const { data: youSharedData } = useGetUsersYouSharedWith();
  const usersYouSharedWith = youSharedData?.users ?? [];

  const sharedByUserOptions = useMemo(
    () => [
      { key: "anybody", text: "anybody", value: "anybody" },
      ...usersSharedWithYou.map((user: any, i: number) => ({
        key: i,
        text: user.email,
        value: user.email,
      })),
    ],
    [usersSharedWithYou],
  );

  const sharedWithUserOptions = useMemo(
    () => [
      { key: "anybody", text: "anybody", value: "anybody" },
      ...usersYouSharedWith.map((user: any, i: number) => ({
        key: i,
        text: user.email,
        value: user.email,
      })),
    ],
    [usersYouSharedWith],
  );

  return (
    <div className={styles.container}>
      {/* Row 1: Category chips + inline contextual user filter */}
      <div className={styles.categoryRow}>
        <WorkflowCategoryFilter category={category} setCategory={setCategory} />
        {category === "shared-with-me" && (
          <div className={styles.contextualFilter}>
            <span className={styles.contextLabel}>by</span>
            <Dropdown
              compact
              selection
              search
              scrolling
              options={sharedByUserOptions}
              value={sharedByUser || "anybody"}
              onChange={(_, { value }) => setSharedByUser(value as string)}
            />
          </div>
        )}
        {category === "i-shared" && (
          <div className={styles.contextualFilter}>
            <span className={styles.contextLabel}>with</span>
            <Dropdown
              compact
              selection
              search
              scrolling
              options={sharedWithUserOptions}
              value={sharedWithUser || "anybody"}
              onChange={(_, { value }) => setSharedWithUser(value as string)}
            />
          </div>
        )}
      </div>

      {/* Row 2: Utility filters */}
      <Grid verticalAlign="middle">
        <WorkflowStatusFilter
          statusFilter={statusFilter}
          filter={setStatusFilter}
          includeDeleted={includeDeleted}
          setIncludeDeleted={setIncludeDeleted}
          hasStatusFilter={hasStatusFilter}
        />
        <WorkflowSessionFilters
          enabled={showOpenSessionsOnly}
          filter={setShowOpenSessionsOnly}
        />
        <Grid.Column mobile={16} tablet={4} computer={3} floated="right">
          <WorkflowSorting value={sortDir} sort={setSortDir} />
        </Grid.Column>
      </Grid>
    </div>
  );
}
