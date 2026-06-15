/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, Icon } from "semantic-ui-react";

import { fetchUsersYouSharedWith } from "~/actions";
import { getUsersSharedWithYou, getUsersYouSharedWith } from "~/selectors";
import WorkflowRefinementMenu from "./WorkflowRefinementMenu";
import WorkflowStatusFilter from "./WorkflowStatusFilter";
import styles from "./WorkflowFilters.module.scss";

const SHARING_OPTIONS = [
  { value: "all", label: "All workflows", icon: "list" },
  { value: "nobody", label: "Private", icon: "lock", indented: true },
  {
    value: "anybody",
    label: "Shared",
    icon: "share alternate",
    indented: true,
  },
];

const SESSION_OPTIONS = [
  { value: "all", label: "All workflows", icon: "list" },
  { value: "open", label: "Open sessions only", icon: "desktop" },
];

const DELETED_OPTIONS = [
  { value: "hidden", label: "Hide deleted runs", icon: "eye slash" },
  { value: "included", label: "Include deleted runs", icon: "eye" },
];

const userOption = (email) => ({
  key: email,
  text: email,
  value: email,
  icon: "user outline",
});

// `selected` is appended when it is not (yet) part of the fetched list, so an
// applied person filter stays readable while the list loads or after the
// underlying share has been revoked.
const toUserOptions = (users, selected) => {
  const options = [
    { key: "anybody", text: "Anybody", value: "anybody", icon: "users" },
    ...users.map((user) => userOption(user.email)),
  ];

  return selected && !options.some((option) => option.value === selected)
    ? [...options, userOption(selected)]
    : options;
};

function FilterSection({
  title,
  active = false,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <button
          type="button"
          className={styles.sectionToggle}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {title}
          {!open && active && <span className={styles.activeDot} />}
          <Icon name={open ? "chevron down" : "chevron right"} />
        </button>
      </h3>
      {open && <div className={styles.sectionContent}>{children}</div>}
    </section>
  );
}

FilterSection.propTypes = {
  title: PropTypes.string.isRequired,
  active: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default function WorkflowFilters({
  category,
  ownedBy,
  sharedWith,
  setSharing,
  statusFilter,
  setStatusFilter,
  includeDeleted,
  setIncludeDeleted,
  hasStatusFilter,
  showOpenSessionsOnly,
  setShowOpenSessionsOnly,
  hasActiveFilters,
  clearFilters,
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dispatch = useDispatch();
  const usersSharedWithYou = useSelector(getUsersSharedWithYou, _.isEqual);
  const usersYouSharedWith = useSelector(getUsersYouSharedWith, _.isEqual);

  // Depends on entering the mode rather than on the selected recipient, so
  // picking a different recipient does not refetch the unchanged list.
  const showsRecipients =
    category === "mine" && Boolean(sharedWith) && sharedWith !== "nobody";

  useEffect(() => {
    if (showsRecipients) {
      dispatch(fetchUsersYouSharedWith());
    }
  }, [dispatch, showsRecipients]);

  useEffect(() => {
    setUserDropdownOpen(false);
  }, [category, ownedBy, sharedWith]);

  const sharedByUserOptions = useMemo(
    () => toUserOptions(usersSharedWithYou, ownedBy),
    [usersSharedWithYou, ownedBy],
  );

  const sharedWithUserOptions = useMemo(
    () => toUserOptions(usersYouSharedWith, sharedWith),
    [usersYouSharedWith, sharedWith],
  );

  return (
    <aside
      className={`${styles.sidebar} ${
        userDropdownOpen ? styles.userDropdownOpen : ""
      }`}
    >
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Filters</h2>
        <button
          type="button"
          className={styles.clearFilters}
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <Icon name="remove filter" />
          Clear filters
        </button>
      </div>

      <FilterSection title="Status" active={hasStatusFilter}>
        <WorkflowStatusFilter
          statusFilter={statusFilter}
          filter={setStatusFilter}
          hasStatusFilter={hasStatusFilter}
        />
      </FilterSection>

      {category === "mine" && (
        <FilterSection title="Sharing" active={sharedWith !== undefined}>
          <WorkflowRefinementMenu
            ariaLabel="Filter your workflows by sharing"
            options={SHARING_OPTIONS}
            value={
              sharedWith === "nobody"
                ? "nobody"
                : sharedWith
                  ? "anybody"
                  : "all"
            }
            onChange={(value) =>
              setSharing(undefined, value === "all" ? undefined : value)
            }
          />
          {showsRecipients && (
            <div className={styles.contextualDropdown}>
              <label className={styles.dropdownLabel}>Shared with</label>
              <Dropdown
                fluid
                selection
                compact
                search
                scrolling
                options={sharedWithUserOptions}
                value={sharedWith}
                onChange={(_, { value }) => setSharing(undefined, value)}
                onOpen={() => setUserDropdownOpen(true)}
                onClose={() => setUserDropdownOpen(false)}
                className={styles.personDropdown}
                aria-label="Filter by person the workflow was shared with"
              />
            </div>
          )}
        </FilterSection>
      )}

      {category === "shared-with-me" && (
        <FilterSection title="Shared by" active={ownedBy !== "anybody"}>
          <Dropdown
            fluid
            selection
            compact
            search
            scrolling
            options={sharedByUserOptions}
            value={ownedBy || "anybody"}
            onChange={(_, { value }) => setSharing(value, undefined)}
            onOpen={() => setUserDropdownOpen(true)}
            onClose={() => setUserDropdownOpen(false)}
            className={styles.personDropdown}
            aria-label="Filter by person who shared the workflow"
          />
        </FilterSection>
      )}

      <FilterSection
        title="Display"
        active={showOpenSessionsOnly || includeDeleted}
        defaultOpen={showOpenSessionsOnly || includeDeleted}
      >
        <div className={styles.displayRow}>
          <span className={styles.displayLabel}>Sessions</span>
          <WorkflowRefinementMenu
            ariaLabel="Filter by session availability"
            options={SESSION_OPTIONS}
            value={showOpenSessionsOnly ? "open" : "all"}
            onChange={(value) => setShowOpenSessionsOnly(value === "open")}
          />
        </div>
        <div className={styles.displayRow}>
          <span className={styles.displayLabel}>Deleted runs</span>
          <WorkflowRefinementMenu
            ariaLabel="Choose deleted run visibility"
            options={DELETED_OPTIONS}
            value={includeDeleted ? "included" : "hidden"}
            onChange={(value) => setIncludeDeleted(value === "included")}
          />
        </div>
      </FilterSection>
    </aside>
  );
}

WorkflowFilters.propTypes = {
  category: PropTypes.oneOf(["mine", "shared-with-me"]).isRequired,
  ownedBy: PropTypes.string,
  sharedWith: PropTypes.string,
  setSharing: PropTypes.func.isRequired,
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func.isRequired,
  includeDeleted: PropTypes.bool.isRequired,
  setIncludeDeleted: PropTypes.func.isRequired,
  hasStatusFilter: PropTypes.bool.isRequired,
  showOpenSessionsOnly: PropTypes.bool.isRequired,
  setShowOpenSessionsOnly: PropTypes.func.isRequired,
  hasActiveFilters: PropTypes.bool.isRequired,
  clearFilters: PropTypes.func.isRequired,
};
