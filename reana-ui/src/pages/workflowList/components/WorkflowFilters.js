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
import WorkflowSessionFilters from "./WorkflowSessionFilters";

export default function WorkflowFilters({
  statusFilter,
  setStatusFilter,
  showDeleted,
  setShowDeleted,
  statusExplicit,
  sortDir,
  setSortDir,
  ownedByFilter,
  setOwnedByFilter,
  sharedWithFilter,
  sharedWithMode,
  setSharedWithFilter,
  setSharedWithModeInUrl,
  interactiveOnlyFilter,
  setInteractiveOnlyFilter,
}) {
  return (
    <div className={styles.container}>
      <Grid verticalAlign="middle">
        <WorkflowStatusFilter
          statusFilter={statusFilter}
          filter={setStatusFilter}
          showDeleted={showDeleted}
          setShowDeleted={setShowDeleted}
          statusExplicit={statusExplicit}
        />
        <WorkflowSessionFilters
          enabled={interactiveOnlyFilter}
          filter={setInteractiveOnlyFilter}
        />
        <WorkflowSharingFilters
          ownedByFilter={ownedByFilter}
          setOwnedByFilter={setOwnedByFilter}
          sharedWithFilter={sharedWithFilter}
          sharedWithMode={sharedWithMode}
          setSharedWithFilter={setSharedWithFilter}
          setSharedWithModeInUrl={setSharedWithModeInUrl}
        />
        <Grid.Column mobile={16} tablet={4} computer={3} floated="right">
          <WorkflowSorting value={sortDir} sort={setSortDir} />
        </Grid.Column>
      </Grid>
    </div>
  );
}

WorkflowFilters.propTypes = {
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func.isRequired,
  showDeleted: PropTypes.bool.isRequired,
  setShowDeleted: PropTypes.func.isRequired,
  statusExplicit: PropTypes.bool.isRequired,
  sortDir: PropTypes.string.isRequired,
  setSortDir: PropTypes.func.isRequired,
  ownedByFilter: PropTypes.string,
  setOwnedByFilter: PropTypes.func.isRequired,
  sharedWithFilter: PropTypes.string,
  sharedWithMode: PropTypes.bool,
  setSharedWithFilter: PropTypes.func.isRequired,
  interactiveOnlyFilter: PropTypes.bool.isRequired,
  setInteractiveOnlyFilter: PropTypes.func.isRequired,
};
