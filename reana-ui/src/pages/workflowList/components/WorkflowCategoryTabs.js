/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Icon, Menu } from "semantic-ui-react";

import { WORKFLOW_CATEGORY_LABELS } from "../workflowListQuery";
import styles from "./WorkflowCategoryTabs.module.scss";

export default function WorkflowCategoryTabs({
  category,
  setCategory,
  refreshedAt,
  refresh,
}) {
  return (
    <header className={styles.viewHeader}>
      <nav className={styles.navigation} aria-label="Workflow views">
        <Menu secondary pointing className={styles.categoryMenu}>
          {Object.entries(WORKFLOW_CATEGORY_LABELS).map(([value, label]) => (
            <Menu.Item
              key={value}
              name={value}
              content={label}
              active={category === value}
              onClick={() => setCategory(value)}
            />
          ))}
        </Menu>
      </nav>
      <button className={styles.refresh} type="button" onClick={refresh}>
        <Icon name="refresh" />
        <span className={styles.refreshLabel}>Refreshed at </span>
        {refreshedAt}
      </button>
    </header>
  );
}

WorkflowCategoryTabs.propTypes = {
  category: PropTypes.oneOf(["mine", "shared-with-me"]).isRequired,
  setCategory: PropTypes.func.isRequired,
  refreshedAt: PropTypes.string.isRequired,
  refresh: PropTypes.func.isRequired,
};
