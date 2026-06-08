/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";

import { Announcement, Notification, Footer, TopHeader } from "~/components";
import { useDocumentTitle } from "~/hooks";

import styles from "./BasePage.module.scss";

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function BasePage({ title, children }: Props) {
  useDocumentTitle(title);
  return (
    <div className={styles["reana-page"]}>
      <Announcement />
      <TopHeader />
      <Notification />
      <div className={styles["main"]}>{children}</div>
      <Footer />
    </div>
  );
}
