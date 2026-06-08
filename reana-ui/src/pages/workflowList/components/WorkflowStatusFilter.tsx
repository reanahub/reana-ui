/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

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

interface WorkflowStatusFiltersProps {
  statusFilter?: string;
  filter: (status: string | undefined) => void;
  includeDeleted: boolean;
  setIncludeDeleted: (value: boolean) => void;
  hasStatusFilter: boolean;
}

export default function WorkflowStatusFilters({
  statusFilter,
  filter,
  includeDeleted,
  setIncludeDeleted,
  hasStatusFilter,
}: WorkflowStatusFiltersProps) {
  const value = hasStatusFilter ? statusFilter : undefined;

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
            const normalized = (next as string) || undefined;
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
          onChange={(_, { checked }) => setIncludeDeleted(!!checked)}
          checked={includeDeleted}
        />
      </Grid.Column>
    </>
  );
}
