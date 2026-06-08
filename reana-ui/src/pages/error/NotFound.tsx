/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Button } from "semantic-ui-react";
import { Link } from "react-router-dom";

import BasePage from "../BasePage";

import styles from "./NotFound.module.scss";

export default function NotFound() {
  return (
    <BasePage title="Page not found">
      <div className={styles.container}>
        <main>
          <h1 className={styles.code}>404</h1>
          <h2>Page not found</h2>
          <p>The page you are looking for could not be found.</p>
          <Link to="/">
            <Button primary>Go to home page</Button>
          </Link>
        </main>
      </div>
    </BasePage>
  );
}
