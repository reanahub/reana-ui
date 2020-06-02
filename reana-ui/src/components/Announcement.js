/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { Icon } from "semantic-ui-react";
import { useSelector } from "react-redux";

import { getAnnouncement } from "../selectors";

import styles from "./Announcement.module.scss";

export default function Announcement() {
  const hiddenAnnouncement = window.localStorage.getItem("hideAnnouncement");
  const announcement = useSelector(getAnnouncement);
  const [hidden, setHidden] = useState(
    hiddenAnnouncement === announcement && hiddenAnnouncement
  );

  function closeAnnouncement() {
    window.localStorage.setItem("hideAnnouncement", announcement);
    setHidden(window.localStorage.getItem("hideAnnouncement"));
  }

  return (
    announcement && (
      <div className={styles.bar} hidden={hidden}>
        <span className={styles.message}>
          <Icon name="warning circle" />
          {announcement}
        </span>
        <Icon
          link
          name="close"
          className={styles.close}
          onClick={closeAnnouncement}
        />
      </div>
    )
  );
}
