/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Button } from "semantic-ui-react";

import styles from "./WorkflowCategoryTabs.module.scss";

type Category = "all" | "mine" | "shared-with-me" | "i-shared";

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All",
  mine: "Mine",
  "shared-with-me": "Shared with me",
  "i-shared": "I shared",
};

interface WorkflowCategoryFilterProps {
  category: Category;
  setCategory: (category: Category) => void;
}

export default function WorkflowCategoryFilter({
  category,
  setCategory,
}: WorkflowCategoryFilterProps) {
  return (
    <Button.Group basic size="small" className={styles.categoryGroup}>
      {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
        ([value, label]) => (
          <Button
            key={value}
            active={category === value}
            onClick={() => setCategory(value)}
          >
            {label}
          </Button>
        ),
      )}
    </Button.Group>
  );
}
