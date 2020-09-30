/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Dropdown } from "semantic-ui-react";

const sortOptions = [
  { key: 1, text: "Newest", value: "desc" },
  { key: 2, text: "Oldest", value: "asc" },
];

export default function WorkflowSorting({ value, sort }) {
  return (
    <Dropdown
      text="Sort by"
      fluid
      selection
      options={sortOptions}
      onChange={(event, data) => sort(data.value)}
      value={value}
    />
  );
}
