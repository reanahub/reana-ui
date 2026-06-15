/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Dropdown } from "semantic-ui-react";

import { WORKFLOW_LIST_SORT_OPTIONS } from "../workflowListQuery";
import styles from "./WorkflowSorting.module.scss";

export default function WorkflowSorting({ value, sort }) {
  const selected = WORKFLOW_LIST_SORT_OPTIONS.find(
    (option) => option.value === value,
  );

  return (
    <div className={styles.sorting}>
      <span className={styles.label}>Sort by</span>
      <Dropdown
        inline
        options={WORKFLOW_LIST_SORT_OPTIONS}
        text={selected?.text}
        onChange={(_, data) => sort(data.value)}
        value={value}
        aria-label="Sort workflows"
        className={styles.dropdown}
      />
    </div>
  );
}

WorkflowSorting.propTypes = {
  value: PropTypes.string.isRequired,
  sort: PropTypes.func.isRequired,
};
