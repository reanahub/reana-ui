/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { unstable_batchedUpdates } from "react-dom";
import { Input } from "semantic-ui-react";
import debounce from "lodash/debounce";

const TYPING_DELAY = 1000;

export default function Search({ search }) {
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

Search.propTypes = {
  search: PropTypes.func.isRequired,
};

export const applyFilter = (filter, pagination, setPagination) => (value) => {
  // FIXME: refactor once implemented by default in future versions of React
  // https://github.com/facebook/react/issues/16387#issuecomment-521623662c
  unstable_batchedUpdates(() => {
    filter(value);
    setPagination({ ...pagination, page: 1 });
  });
};
