/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEqual from "lodash/isEqual";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Checkbox, Dropdown, Grid } from "semantic-ui-react";

import { NON_DELETED_STATUSES, WORKFLOW_STATUSES } from "~/config";
import { statusMapping } from "~/util";

function removeDeleted(statuses) {
  return statuses.filter((status) => status !== "deleted");
}

const statusOptions = WORKFLOW_STATUSES.map((status) => ({
  key: status,
  text: status,
  value: status,
  icon: statusMapping[status].icon,
}));

const nonDeletedStatusOptions = statusOptions.filter(
  ({ value: status }) => status !== "deleted",
);

export default function WorkflowStatusFilters({ statusFilter, filter }) {
  const [valueList, setValueList] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    // Keep the list of selected statuses in sync with the filter used to make the
    // requests to the API
    let selection = [...valueList];
    if (!showDeleted) selection = removeDeleted(selection);
    if (!showDeleted && !selection.length) selection = NON_DELETED_STATUSES;

    if (!isEqual(selection, statusFilter)) {
      filter(selection);
    }
  }, [filter, statusFilter, showDeleted, valueList]);

  return (
    <>
      <Grid.Column mobile={16} tablet={4} computer={3}>
        <Dropdown
          text="Status"
          fluid
          closeOnChange
          selection
          multiple
          options={showDeleted ? statusOptions : nonDeletedStatusOptions}
          onChange={(_, { value }) => setValueList(value)}
          value={valueList}
        />
      </Grid.Column>
      <Grid.Column
        mobile={16}
        tablet={5}
        computer={4}
        className="center aligned"
      >
        <Checkbox
          toggle
          label="Show deleted runs"
          onChange={(_, { checked }) => setShowDeleted(checked)}
          checked={showDeleted}
        />
      </Grid.Column>
    </>
  );
}

WorkflowStatusFilters.propTypes = {
  statusFilter: PropTypes.array.isRequired,
  filter: PropTypes.func.isRequired,
};
