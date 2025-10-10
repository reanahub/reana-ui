/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Input, Icon } from "semantic-ui-react";
import isEqual from "lodash/isEqual";

import styles from "./Search.module.scss";

export default function Search({
  value = "",
  onChange,
  onSubmit,
  loading = false,
}) {
  const handleChange = (text) => {
    if (typeof onChange === "function") {
      onChange(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && typeof onSubmit === "function") {
      onSubmit();
    }
  };

  const handleClick = () => {
    if (typeof onSubmit === "function") {
      onSubmit();
    }
  };

  return (
    <Input
      fluid
      icon="search"
      placeholder="Search..."
      value={value}
      className={styles.input}
      onChange={(_, data) => handleChange(data.value)}
      onKeyDown={handleKeyDown}
      iconPosition="right"
      loading={loading}
      aria-label="Search workflows"
    >
      <input />
      <Icon name="search" link onClick={handleClick} title="Search" />
    </Input>
  );
}

Search.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
  search: PropTypes.func,
};

export const applyFilter = (setFilter, resetPage) => (nextValue) => {
  setFilter((prevValue) => {
    if (isEqual(prevValue, nextValue)) {
      return prevValue;
    }
    resetPage();
    return nextValue;
  });
};
