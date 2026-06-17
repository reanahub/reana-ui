/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023, 2024, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import styles from "./WorkflowBadges.module.scss";
import PropTypes from "prop-types";
import { Label, Popup } from "semantic-ui-react";
import { JupyterNotebookIcon, DaskIcon } from "~/components";
import client, {
  DASK_DASHBOARD_URL,
  INTERACTIVE_SESSION_SECRET_URL,
  INTERACTIVE_SESSION_URL,
} from "~/client";
import { errorActionCreator } from "~/actions";
import { LauncherLabel } from "~/components";
import { getUserEmail } from "~/selectors";
import { useDispatch, useSelector } from "react-redux";

export default function WorkflowBadges({ workflow, badgeSize = "tiny" }) {
  const dispatch = useDispatch();
  const userEmail = useSelector(getUserEmail);
  const {
    size,
    launcherURL,
    services,
    session_uri: sessionUri,
    session_status: sessionStatus,
    ownerEmail,
    sharedWith = [],
  } = workflow;
  const hasDiskUsage = size.raw > 0;
  const isSessionOpen = sessionStatus === "running";
  const isDaskClusterUp =
    services.length > 0 && services[0].status === "running";
  const isOwner = ownerEmail === userEmail;
  const isSharedWithMe = !isOwner;
  const iShared = isOwner && sharedWith.length > 0;
  const sharedWithLabel =
    sharedWith.length === 1 ? sharedWith[0] : `${sharedWith.length} people`;

  const handleOpenInteractiveSession = (event) => {
    event.preventDefault();
    const sessionWindow = window.open("", "_blank");
    if (sessionWindow) {
      sessionWindow.opener = null;
      // The target URL isn't known synchronously (it needs the async
      // secret fetch below), so this can't be a real <a rel="noreferrer">
      // click like the rest of this file uses. Achieve the same effect by
      // setting the popup's own referrer policy before navigating it --
      // it starts as a same-origin about:blank document, so this is safe.
      const noReferrerMeta = sessionWindow.document.createElement("meta");
      noReferrerMeta.name = "referrer";
      noReferrerMeta.content = "no-referrer";
      sessionWindow.document.head.appendChild(noReferrerMeta);
    }

    client
      .getInteractiveSessionSecret(workflow.id)
      .then((resp) => {
        const sessionUrl = INTERACTIVE_SESSION_URL(
          sessionUri,
          resp.data.session_secret,
        );
        if (sessionWindow) {
          sessionWindow.location.href = sessionUrl;
        } else {
          window.location.assign(sessionUrl);
        }
      })
      .catch((error) => {
        if (sessionWindow) sessionWindow.close();
        dispatch(
          errorActionCreator(
            error,
            INTERACTIVE_SESSION_SECRET_URL(workflow.id),
          ),
        );
      });
  };

  return (
    <div className={styles.badgesContainer}>
      {isOwner && (
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
              as="button"
              type="button"
              onClick={handleOpenInteractiveSession}
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
          {iShared && (
            <Popup
              trigger={
                <Label
                  basic
                  size={badgeSize}
                  content={`Shared with ${sharedWithLabel}`}
                  icon="share alternate"
                  className={styles.sharedByMeBadge}
                />
              }
              position="top center"
              content={`You shared this workflow with: ${sharedWith.join(", ")}`}
            />
          )}
        </>
      )}
      {isSharedWithMe && (
        <Popup
          trigger={
            <Label
              basic
              size={badgeSize}
              content={`Shared by ${ownerEmail}`}
              icon="eye"
              className={styles.sharedWithMeBadge}
            />
          }
          position="top center"
          content={`This workflow is read-only and shared with you by ${ownerEmail}`}
        />
      )}
    </div>
  );
}

WorkflowBadges.propTypes = {
  workflow: PropTypes.object.isRequired,
  badgeSize: PropTypes.string,
};
