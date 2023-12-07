/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Grid } from "semantic-ui-react";

import WorkflowStatusFilter from "./WorkflowStatusFilter";
import WorkflowSorting from "./WorkflowSorting";

import styles from "./WorkflowFilters.module.scss";
import WorkflowSharingFilters from "./WorkflowSharingFilter";

export default function WorkflowFilters({
  statusFilter,
  setStatusFilter,
  sortDir,
  setSortDir,
  ownedByFilter,
  setOwnedByFilter,
  sharedWithFilter,
  setSharedWithFilter,
}) {
  return (
    <div className={styles.container}>
      <Grid verticalAlign="middle">
        <WorkflowStatusFilter
          statusFilter={statusFilter}
          filter={setStatusFilter}
        />
        <WorkflowSharingFilters
          ownedByFilter={ownedByFilter}
          setOwnedByFilter={setOwnedByFilter}
          sharedWithFilter={sharedWithFilter}
          setSharedWithFilter={setSharedWithFilter}
        />
        <Grid.Column mobile={16} tablet={4} computer={3} floated="right">
          <WorkflowSorting value={sortDir} sort={setSortDir} />
        </Grid.Column>
      </Grid>
    </div>
  );
}

WorkflowFilters.propTypes = {
  statusFilter: PropTypes.array.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  sortDir: PropTypes.string.isRequired,
  setSortDir: PropTypes.func.isRequired,
  ownedByFilter: PropTypes.string,
  setOwnedByFilter: PropTypes.func.isRequired,
  sharedWithFilter: PropTypes.string,
  setSharedWithFilter: PropTypes.func.isRequired,
};
