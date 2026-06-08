/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Input, Icon } from "semantic-ui-react";
import styles from "./Search.module.scss";

interface Props {
  value?: string;
  onChange?: (text: string) => void;
  onSubmit?: () => void;
  loading?: boolean;
}

export default function Search({
  value = "",
  onChange,
  onSubmit,
  loading = false,
}: Props) {
  const handleChange = (text: string) => {
    if (typeof onChange === "function") {
      onChange(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      iconPosition={"right" as any}
      loading={loading}
      aria-label="Search workflows"
    >
      <input />
      <Icon name="search" link onClick={handleClick} title="Search" />
    </Input>
  );
}
