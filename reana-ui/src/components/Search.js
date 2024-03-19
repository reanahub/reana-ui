/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Input } from "semantic-ui-react";
import debounce from "lodash/debounce";

import styles from "./Search.module.scss";

const TYPING_DELAY = 1000;

export default function Search({ search, loading = false }) {
  const handleChange = debounce(search, TYPING_DELAY);
  return (
    <Input
      fluid
      icon="search"
      placeholder="Search..."
      className={styles.input}
      onChange={(_, data) => handleChange(data.value)}
      loading={loading}
    />
  );
}

Search.propTypes = {
  search: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export const applyFilter = (filter, pagination, setPagination) => (value) => {
  filter(value);
  setPagination({ ...pagination, page: 1 });
};
