/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import styles from "./WorkflowBadges.module.scss";
import PropTypes from "prop-types";
import { Label, Popup } from "semantic-ui-react";
import { JupyterNotebookIcon, DaskIcon } from "~/components";
import { INTERACTIVE_SESSION_URL, DASK_DASHBOARD_URL } from "~/client";
import { LauncherLabel } from "~/components";
import { getReanaToken, getUserEmail } from "~/selectors";
import { useSelector } from "react-redux";

export default function WorkflowBadges({ workflow, badgeSize = "tiny" }) {
  const reanaToken = useSelector(getReanaToken);
  const userEmail = useSelector(getUserEmail);
  const {
    size,
    launcherURL,
    services,
    session_uri: sessionUri,
    session_status: sessionStatus,
  } = workflow;
  const hasDiskUsage = size.raw > 0;
  const isSessionOpen = sessionStatus === "running";
  const isDaskClusterUp =
    services.length > 0 && services[0].status === "running";

  return (
    <div className={styles.badgesContainer}>
      {workflow.ownerEmail === userEmail && (
        <>
          {workflow.duration && (
            <Label
              basic
              size={badgeSize}
              content={`CPU ${workflow.duration}`}
              icon="clock"
            />
          )}
          {hasDiskUsage && (
            <Label
              basic
              size={badgeSize}
              content={`Disk ${size.human_readable}`}
              icon="hdd"
            />
          )}
          <LauncherLabel url={launcherURL} />
          {isSessionOpen && (
            <Label
              size={badgeSize}
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
          {isDaskClusterUp && (
            <Label
              size={badgeSize}
              content={"Dashboard"}
              icon={
                <i className="icon">
                  <DaskIcon size={12} />
                </i>
              }
              as="a"
              href={DASK_DASHBOARD_URL(workflow.id)}
              target="_blank"
              rel="noopener noreferrer"
            />
          )}
        </>
      )}
      {workflow.ownerEmail !== userEmail && (
        <Popup
          trigger={
            <Label basic size="tiny" content={workflow.ownerEmail} icon="eye" />
          }
          position="top center"
          content={
            "This workflow is read-only shared with you by " +
            workflow.ownerEmail
          }
        />
      )}
    </div>
  );
}

WorkflowBadges.propTypes = {
  workflow: PropTypes.object.isRequired,
  badgeSize: PropTypes.string,
};
