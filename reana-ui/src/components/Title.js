/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Header } from "semantic-ui-react";
import PropTypes from "prop-types";

import styles from "./Title.module.scss";

export default function Title({ className, ...restProps }) {
  return (
    <Header
      as="h2"
      {...restProps}
      className={`${styles["title"]} ${className}`}
    />
  );
}

Title.propTypes = {
  className: PropTypes.string,
};

Title.defaultProps = {
  className: "",
};
