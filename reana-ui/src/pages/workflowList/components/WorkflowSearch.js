/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";

import { Input } from "semantic-ui-react";
import _ from "lodash";

const TYPING_DELAY = 1000;

export default function WorkflowSearch({ search }) {
  const handleChange = _.debounce(search, TYPING_DELAY);
  return (
    <Input
      fluid
      icon="search"
      placeholder="Search..."
      onChange={(event, data) => handleChange(data.value)}
    />
  );
}
