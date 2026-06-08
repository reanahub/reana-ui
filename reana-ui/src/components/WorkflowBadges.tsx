/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023, 2024, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import styles from "./WorkflowBadges.module.scss";
import { Label, Popup } from "semantic-ui-react";
import { JupyterNotebookIcon, DaskIcon } from "~/components";
import { INTERACTIVE_SESSION_URL, DASK_DASHBOARD_URL } from "~/client";
import { LauncherLabel } from "~/components";
import { useGetYou } from "~/api/hooks";
import { ParsedWorkflow } from "~/util";

interface Props {
  workflow: ParsedWorkflow;
  badgeSize?: string;
  className?: string;
}

export default function WorkflowBadges({
  workflow,
  badgeSize = "tiny",
}: Props) {
  const { data: youData } = useGetYou();
  const reanaToken = youData?.reana_token?.value ?? "";
  const userEmail = youData?.email ?? "";
  const { launcherURL, ownerEmail, sharedWith = [] } = workflow;
  const size = workflow.size as
    | { raw: number; human_readable: string }
    | undefined;
  const services =
    (workflow.services as Array<{ status: string }> | undefined) ?? [];
  const sessionUri = workflow.session_uri as string | undefined;
  const sessionStatus = workflow.session_status as string | undefined;
  const hasDiskUsage = size !== undefined && size.raw > 0;
  const isSessionOpen = sessionStatus === "running";
  const isDaskClusterUp =
    services.length > 0 && services[0].status === "running";
  const isOwner = ownerEmail === userEmail;
  const isSharedWithMe = !isOwner;
  const iShared = isOwner && sharedWith.length > 0;

  const sharedWithLabel =
    sharedWith.length === 1 ? sharedWith[0] : `${sharedWith.length} people`;

  return (
    <div className={styles.badgesContainer}>
      {isOwner && (
        <>
          {workflow.duration && (
            <Label
              basic
              size={badgeSize as any}
              content={`CPU ${workflow.duration}`}
              icon="clock"
            />
          )}
          {hasDiskUsage && (
            <Label
              basic
              size={badgeSize as any}
              content={`Disk ${size.human_readable}`}
              icon="hdd"
            />
          )}
          <LauncherLabel url={launcherURL} />
          {isSessionOpen && (
            <Label
              size={badgeSize as any}
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
              size={badgeSize as any}
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
                  size={badgeSize as any}
                  content={`Shared with ${sharedWithLabel}`}
                  icon="share alternate"
                  className={styles.sharedByMeBadge}
                />
              }
              position="top center"
              content={
                sharedWith.length === 1
                  ? `You shared this workflow with ${sharedWith[0]}`
                  : `You shared this workflow with: ${sharedWith.join(", ")}`
              }
            />
          )}
        </>
      )}
      {isSharedWithMe && (
        <Popup
          trigger={
            <Label
              size={badgeSize as any}
              content={ownerEmail}
              icon="eye"
              className={styles.sharedWithMeBadge}
            />
          }
          position="top center"
          content={`This workflow is read-only shared with you by ${ownerEmail}`}
        />
      )}
    </div>
  );
}
