/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Header, HeaderProps } from "semantic-ui-react";

import styles from "./Title.module.scss";

interface Props extends HeaderProps {
  className?: string;
}

export default function Title({ className = "", ...restProps }: Props) {
  return (
    <Header
      as="h2"
      {...restProps}
      className={`${styles["title"]} ${className}`}
    />
  );
}
