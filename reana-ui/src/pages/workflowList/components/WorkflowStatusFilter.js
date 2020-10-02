/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import PropTypes from "prop-types";
import { Dropdown } from "semantic-ui-react";

import { statusMapping } from "../../../util";

const statusOptions = Object.keys(statusMapping).map((status) => ({
  key: status,
  text: status,
  value: status,
  icon: statusMapping[status].icon,
}));

export default function WorkflowStatusFilters({ valueList, filter }) {
  return (
    <Dropdown
      text="Status"
      closeOnChange
      selection
      multiple
      options={statusOptions}
      onChange={(_, data) => filter(data.value)}
      value={valueList}
    />
  );
}

WorkflowStatusFilters.propTypes = {
  valueList: PropTypes.array.isRequired,
  filter: PropTypes.func.isRequired,
};
