/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Checkbox, Grid } from "semantic-ui-react";

interface WorkflowSessionFiltersProps {
  enabled: boolean;
  filter: (value: boolean) => void;
}

export default function WorkflowSessionFilters({
  enabled,
  filter,
}: WorkflowSessionFiltersProps) {
  return (
    <Grid.Column mobile={16} tablet={4} computer={3} className="center aligned">
      <Checkbox
        toggle
        label="Open sessions"
        checked={enabled}
        onChange={(_, { checked }) => filter(!!checked)}
      />
    </Grid.Column>
  );
}
