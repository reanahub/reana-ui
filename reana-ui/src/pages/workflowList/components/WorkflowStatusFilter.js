/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { useState } from "react";
import { Icon, Menu } from "semantic-ui-react";

import { NON_DELETED_STATUSES } from "~/config";
import { statusMapping } from "~/util";
import styles from "./WorkflowStatusFilter.module.scss";

// Curated statuses that are always visible; the rest stay behind "More
// statuses" but are derived so a new status cannot be silently omitted.
const PRIMARY_STATUSES = ["running", "finished", "failed", "stopped"];
const MORE_STATUSES = NON_DELETED_STATUSES.filter(
  (status) => !PRIMARY_STATUSES.includes(status),
);

export default function WorkflowStatusFilter({
  statusFilter,
  filter,
  hasStatusFilter,
}) {
  const value = hasStatusFilter ? statusFilter : undefined;
  const [showMore, setShowMore] = useState(false);
  // An active secondary status stays listed even while collapsed, so the
  // applied filter is never hidden by "Fewer statuses".
  const activeMoreStatus = MORE_STATUSES.includes(value) ? value : undefined;

  const statuses = showMore
    ? [...PRIMARY_STATUSES, ...MORE_STATUSES]
    : [...PRIMARY_STATUSES, ...(activeMoreStatus ? [activeMoreStatus] : [])];

  const statusItem = (status) => (
    <Menu.Item
      key={status}
      name={status}
      active={value === status}
      onClick={() => filter(status)}
    >
      <Icon
        name={statusMapping[status].icon}
        color={statusMapping[status].color}
      />
      <span>{status}</span>
    </Menu.Item>
  );

  return (
    <>
      <Menu
        secondary
        vertical
        fluid
        className={styles.statusMenu}
        aria-label="Filter by status"
      >
        <Menu.Item name="any" active={!value} onClick={() => filter(undefined)}>
          <Icon name="circle outline" />
          <span>Any</span>
        </Menu.Item>
        {statuses.map(statusItem)}
      </Menu>
      <button
        type="button"
        className={styles.moreStatuses}
        onClick={() => setShowMore(!showMore)}
        aria-expanded={showMore}
      >
        <Icon name={showMore ? "chevron up" : "chevron down"} />
        {showMore ? "Fewer statuses" : "More statuses"}
      </button>
    </>
  );
}

WorkflowStatusFilter.propTypes = {
  statusFilter: PropTypes.string,
  filter: PropTypes.func.isRequired,
  hasStatusFilter: PropTypes.bool.isRequired,
};
