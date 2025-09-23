/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEqual from "lodash/isEqual";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Checkbox, Grid } from "semantic-ui-react";

export default function WorkflowSessionFilters({
  enabled: enabledProp,
  filter,
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Notify parent when the toggle changes
    if (!isEqual(enabled, enabledProp)) {
      filter(enabled);
    }
  }, [enabled, enabledProp]);

  return (
    <>
      <Grid.Column
        mobile={16}
        tablet={4}
        computer={3}
        className="center aligned"
      >
        <Checkbox
          toggle
          label="Only with sessions"
          checked={enabled}
          onChange={(_, { checked }) => setEnabled(!!checked)}
        />
      </Grid.Column>
    </>
  );
}

WorkflowSessionFilters.propTypes = {
  enabled: PropTypes.bool.isRequired,
  filter: PropTypes.func.isRequired,
};
