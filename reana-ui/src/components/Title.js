/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import PropTypes from "prop-types";
import { Header } from "semantic-ui-react";

import styles from "./Title.module.scss";

export default function Title({ children, as }) {
  return (
    <Header as={as} className={styles["title"]}>
      {children}
    </Header>
  );
}

Title.propTypes = {
  as: PropTypes.string
};

Title.defaultProps = {
  as: "h2"
};
