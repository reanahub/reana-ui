/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon, Menu, Popup } from "semantic-ui-react";

import { useNotification } from "~/NotificationContext";
import { useGetYou } from "~/api/hooks";
import client from "~/client";
import { ParsedWorkflow } from "~/util";

import { JupyterNotebookIcon } from "~/components";
import WorkflowDeleteModal from "./WorkflowDeleteModal";
import WorkflowPruneModal from "./WorkflowPruneModal";
import WorkflowShareModal from "./WorkflowShareModal";
import WorkflowStopModal from "./WorkflowStopModal";
import InteractiveSessionModal from "./InteractiveSessionModal";

import styles from "./WorkflowActionsPopup.module.scss";

interface Props {
  workflow: ParsedWorkflow;
  className?: string;
}

const JupyterIcon = <JupyterNotebookIcon className={styles["jupyter-icon"]} />;

export default function WorkflowActionsPopup({
  workflow,
  className = "",
}: Props) {
  const { notify, notifyError } = useNotification();
  const queryClient = useQueryClient();
  const userEmail = useGetYou().data?.email ?? "";

  // Popup open/closed
  const [popupOpen, setPopupOpen] = useState(false);

  // Controlled modal states — co-located with their trigger
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [pruneOpen, setPruneOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  const { id, status } = workflow;
  const size = workflow.size as { raw: number } | undefined;
  const sessionStatus = workflow.session_status as string | undefined;
  const isDeleted = status === "deleted";
  const isDeletedUsingWorkspace =
    isDeleted && size !== undefined && size.raw > 0;
  const isRunning = status === "running";
  const isSessionOpen = sessionStatus === "running";

  const closePopup = () => setPopupOpen(false);

  const menuItems: any[] = [];

  if (!isDeleted && !isSessionOpen) {
    menuItems.push({
      key: "openNotebook",
      content: "Open Jupyter Notebook",
      icon: JupyterIcon,
      onClick: () => {
        setSessionOpen(true);
        closePopup();
      },
    });
  }

  menuItems.push({
    key: "share",
    content: "Share workflow",
    icon: "share alternate",
    onClick: () => {
      setShareOpen(true);
      closePopup();
    },
  });

  if (isSessionOpen) {
    menuItems.push({
      key: "closeNotebook",
      content: "Close Jupyter Notebook",
      icon: JupyterIcon,
      onClick: async () => {
        closePopup();
        try {
          const resp = await client.closeInteractiveSession(id);
          queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
          notify("Success!", (resp.data as any).message);
        } catch (err) {
          notifyError(err);
        }
      },
    });
  }

  if (isRunning) {
    menuItems.push({
      key: "stop",
      content: "Stop workflow",
      icon: "stop",
      onClick: () => {
        setStopOpen(true);
        closePopup();
      },
    });
  }

  if (!isDeleted && !isRunning) {
    menuItems.push({
      key: "prune",
      content: "Prune workspace",
      icon: "filter",
      onClick: () => {
        setPruneOpen(true);
        closePopup();
      },
    });
  }

  if (!isDeleted && !isRunning) {
    menuItems.push({
      key: "delete",
      content: "Delete workflow",
      icon: "trash",
      onClick: () => {
        setDeleteOpen(true);
        closePopup();
      },
    });
  }

  if (isDeletedUsingWorkspace) {
    menuItems.push({
      key: "freeup",
      content: "Free up disk",
      icon: "hdd",
      onClick: async () => {
        closePopup();
        try {
          const resp = await client.deleteWorkflow(id, {
            workspace: true,
            allRuns: false,
          });
          queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
          notify("Success!", (resp.data as any).message);
        } catch (err) {
          notifyError(err);
        }
      },
    });
  }

  if (workflow.ownerEmail !== userEmail || menuItems.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Popup
        basic
        trigger={
          <Icon
            link
            name="ellipsis vertical"
            className={styles.icon}
            onClick={() => setPopupOpen(true)}
          />
        }
        position="bottom left"
        on="click"
        open={popupOpen}
        onClose={closePopup}
      >
        <Menu items={menuItems} secondary vertical />
      </Popup>

      {/* Modals are co-located here; Semantic UI renders them via a portal
          at document.body, so DOM nesting does not affect z-index or overlay */}
      <WorkflowDeleteModal
        workflow={workflow}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
      <WorkflowStopModal
        workflow={workflow}
        isOpen={stopOpen}
        onClose={() => setStopOpen(false)}
      />
      <WorkflowPruneModal
        workflow={workflow}
        isOpen={pruneOpen}
        onClose={() => setPruneOpen(false)}
      />
      <WorkflowShareModal
        workflow={workflow}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
      <InteractiveSessionModal
        workflow={workflow}
        isOpen={sessionOpen}
        onClose={() => setSessionOpen(false)}
      />
    </div>
  );
}
