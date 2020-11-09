/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";

import { Input } from "semantic-ui-react";
import debounce from "lodash/debounce";

const TYPING_DELAY = 1000;

export default function WorkflowSearch({ search }) {
  const handleChange = debounce(search, TYPING_DELAY);
  return (
    <Input
      fluid
      icon="search"
      placeholder="Search..."
      onChange={(_, data) => handleChange(data.value)}
    />
  );
}

WorkflowSearch.propTypes = {
  search: PropTypes.func.isRequired,
};
