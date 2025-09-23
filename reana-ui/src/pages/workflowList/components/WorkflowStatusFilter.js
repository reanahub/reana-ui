/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Checkbox, Dropdown, Grid } from "semantic-ui-react";
import { WORKFLOW_STATUSES } from "~/config";
import { statusMapping } from "~/util";

// Not including deleted in the dropdown, toggle is the source of truth.
const statusOptions = WORKFLOW_STATUSES.filter((s) => s !== "deleted").map(
  (status) => ({
    key: status,
    text: status,
    value: status,
    icon: statusMapping[status].icon,
  }),
);

export default function WorkflowStatusFilters({
  statusFilter,
  filter,
  showDeleted,
  setShowDeleted,
  statusExplicit,
}) {
  const [value, setValue] = useState(statusExplicit ? statusFilter : undefined);

  useEffect(() => {
    setValue(statusExplicit ? statusFilter : undefined);
  }, [statusFilter, statusExplicit]);

  // If URL  contains ?status=deleted, remove param
  useEffect(() => {
    if (statusExplicit && statusFilter === "deleted") {
      setValue(undefined);
      filter(undefined);
    }
  }, [statusExplicit, statusFilter, filter]);

  return (
    <>
      <Grid.Column mobile={16} tablet={4} computer={3}>
        <Dropdown
          text={value ?? "Status"}
          fluid
          selection
          clearable
          options={statusOptions}
          onChange={(_, { value: next }) => {
            const normalized = next || undefined;
            setValue(normalized);
            filter(normalized);
          }}
          value={value ?? null}
        />
      </Grid.Column>
      <Grid.Column
        mobile={16}
        tablet={4}
        computer={3}
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
  statusFilter: PropTypes.string,
  filter: PropTypes.func.isRequired,
  showDeleted: PropTypes.bool.isRequired,
  setShowDeleted: PropTypes.func.isRequired,
  statusExplicit: PropTypes.bool.isRequired,
};
