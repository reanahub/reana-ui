/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Icon, Menu } from "semantic-ui-react";

import styles from "./WorkflowRefinementMenu.module.scss";

export default function WorkflowRefinementMenu({
  ariaLabel,
  options,
  value,
  onChange,
}) {
  return (
    <Menu
      secondary
      vertical
      fluid
      className={styles.refinementMenu}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <Menu.Item
          key={option.value}
          name={option.value}
          active={value === option.value}
          className={option.indented ? styles.indented : undefined}
          onClick={() => onChange(option.value)}
        >
          <Icon name={option.icon} />
          <span>{option.label}</span>
        </Menu.Item>
      ))}
    </Menu>
  );
}

WorkflowRefinementMenu.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      indented: PropTypes.bool,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
