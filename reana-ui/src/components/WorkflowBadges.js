/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import styles from "./WorkflowBadges.module.scss";
import { Icon, Label, Popup } from "semantic-ui-react";
import { JupyterNotebookIcon } from "~/components";
import { INTERACTIVE_SESSION_URL } from "~/client";
import { LauncherLabel } from "~/components";
import { getReanaToken } from "~/selectors";
import { useSelector } from "react-redux";

export default function WorkflowBadges({ workflow }) {
  const reanaToken = useSelector(getReanaToken);
  const {
    size,
    launcherURL,
    session_uri: sessionUri,
    session_status: sessionStatus,
  } = workflow;
  const hasDiskUsage = size.raw > 0;
  const isSessionOpen = sessionStatus === "created";

  return (
    <div className={styles.badgesContainer}>
      {workflow.owner_email === "-" ? (
        <>
          {workflow.duration && (
            <Label
              basic
              size="tiny"
              content={`CPU ${workflow.duration}`}
              icon="clock"
            />
          )}
          {hasDiskUsage && (
            <Label
              basic
              size="tiny"
              content={`Disk ${size.human_readable}`}
              icon="hdd"
            />
          )}
          <LauncherLabel url={launcherURL} />
          {isSessionOpen && (
            <Label
              size="tiny"
              content={"Notebook"}
              icon={
                <i className="icon">
                  <JupyterNotebookIcon size={12} />
                </i>
              }
              as="a"
              href={INTERACTIVE_SESSION_URL(sessionUri, reanaToken)}
              target="_blank"
              rel="noopener noreferrer"
            />
          )}
        </>
      ) : (
        <Popup
          trigger={
            <span className={styles.owner}>
              <Icon name="eye" style={{ marginTop: "-3px" }} />
              {workflow.owner_email}
            </span>
          }
          position="top center"
          content={
            "This workflow is read-only shared with you by " +
            workflow.owner_email
          }
        />
      )}
    </div>
  );
}
