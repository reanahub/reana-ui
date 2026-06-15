/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Button, Divider, Icon } from "semantic-ui-react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import {
  Box,
  WorkflowBadges,
  WorkflowInfo,
  WorkflowDeleteModal,
  WorkflowPruneModal,
  WorkflowShareModal,
  WorkflowStopModal,
  WorkflowActionsPopup,
  InteractiveSessionModal,
} from "~/components";

import styles from "./WorkflowList.module.scss";

const noop = () => {};

function WorkflowListItem({ workflow }) {
  const cardClass = workflow.status === "deleted" ? styles.deleted : "";

  return (
    <Box className={cardClass} padding={false} flex={false}>
      <Link to={`/workflows/${workflow.id}`}>
        <div className={styles["workflow-details-container"]}>
          <WorkflowInfo workflow={workflow} actionsOnHover={true} />
        </div>
      </Link>
      <Divider className={styles.divider}></Divider>
      <div className={styles["badges-and-actions"]}>
        <WorkflowBadges workflow={workflow} />
        <WorkflowActionsPopup workflow={workflow} />
      </div>
    </Box>
  );
}

WorkflowListItem.propTypes = {
  workflow: PropTypes.object.isRequired,
};

function EmptyWorkflowList({ hasActiveFilters, clearFilters }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <Icon name={hasActiveFilters ? "filter" : "folder open outline"} />
      </div>
      <div>
        <h2>No workflows found</h2>
        <p>
          {hasActiveFilters
            ? "The current filters do not match any workflows."
            : "There are no workflows to show in this view."}
        </p>
        {hasActiveFilters && (
          <Button
            compact
            className={styles.clearFilters}
            onClick={clearFilters}
          >
            <Icon name="remove filter" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

EmptyWorkflowList.propTypes = {
  hasActiveFilters: PropTypes.bool.isRequired,
  clearFilters: PropTypes.func,
};

export default function WorkflowList({
  workflows,
  loading,
  hasActiveFilters = false,
  clearFilters = noop,
}) {
  if (loading && !workflows.length) return null;

  if (!workflows.length) {
    return (
      <EmptyWorkflowList
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />
    );
  }
  return (
    <>
      <div className={styles.list}>
        <div className={loading ? styles.dimmed : undefined}>
          {workflows.map((workflow) => (
            <WorkflowListItem key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </div>
      <InteractiveSessionModal />
      <WorkflowDeleteModal />
      <WorkflowPruneModal />
      <WorkflowStopModal />
      <WorkflowShareModal />
    </>
  );
}

WorkflowList.propTypes = {
  workflows: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  hasActiveFilters: PropTypes.bool,
  clearFilters: PropTypes.func,
};
