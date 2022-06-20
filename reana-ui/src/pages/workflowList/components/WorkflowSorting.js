/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Dropdown } from "semantic-ui-react";

const sortOptions = [
  { key: 1, text: "Latest first", value: "desc" },
  { key: 2, text: "Oldest first", value: "asc" },
  { key: 3, text: "Most Disk used", value: "disk-desc" },
  { key: 4, text: "Most CPU used", value: "cpu-desc" },
];

export default function WorkflowSorting({ value, sort }) {
  return (
    <Dropdown
      fluid
      selection
      options={sortOptions}
      onChange={(_, data) => sort(data.value)}
      value={value}
    />
  );
}

WorkflowSorting.propTypes = {
  value: PropTypes.string.isRequired,
  sort: PropTypes.func.isRequired,
};
