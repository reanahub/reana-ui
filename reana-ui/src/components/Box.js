/*
  This file is part of REANA.
  Copyright (C) 2022, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import styles from "./Box.module.scss";

export default function Box({
  children,
  className,
  padding = true,
  flex = true,
}) {
  return (
    <div
      className={`${styles.box} ${className} ${padding ? styles.padding : ""} ${
        flex ? styles.flex : ""
      }`}
    >
      {children}
    </div>
  );
}
