/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import PropTypes from "prop-types";
import { Icon, Menu, Popup } from "semantic-ui-react";
import { useDispatch } from "react-redux";

import { workflowShape } from "~/props";
import {
  deleteWorkflow,
  closeInteractiveSession,
  openDeleteWorkflowModal,
  openStopWorkflowModal,
  openInteractiveSessionModal,
} from "~/actions";

import { JupyterNotebookIcon } from "~/components";

import styles from "./WorkflowActionsPopup.module.scss";

const JupyterIcon = <JupyterNotebookIcon className={styles["jupyter-icon"]} />;

export default function WorkflowActionsPopup({ workflow, className }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { id, size, status, session_status: sessionStatus } = workflow;
  const isDeleted = status === "deleted";
  const isDeletedUsingWorkspace = isDeleted && size.raw > 0;
  const isRunning = status === "running";
  const isSessionOpen = sessionStatus === "created";

  let menuItems = [];

  if (!isDeleted && !isSessionOpen) {
    menuItems.push({
      key: "openNotebook",
      content: "Open Jupyter Notebook",
      icon: JupyterIcon,
      onClick: (e) => {
        dispatch(openInteractiveSessionModal(workflow));
        setOpen(false);
        e.stopPropagation();
      },
    });
  }

  if (isSessionOpen) {
    menuItems.push({
      key: "closeNotebook",
      content: "Close Jupyter Notebook",
      icon: JupyterIcon,
      onClick: (e) => {
        dispatch(closeInteractiveSession(id));
        setOpen(false);
        e.stopPropagation();
      },
    });
  }

  if (isRunning) {
    menuItems.push({
      key: "stop",
      content: "Stop workflow",
      icon: "stop",
      onClick: (e) => {
        dispatch(openStopWorkflowModal(workflow));
        setOpen(false);
        e.stopPropagation();
      },
    });
  }

  if (!isDeleted && !isRunning) {
    menuItems.push({
      key: "delete",
      content: "Delete workflow",
      icon: "trash",
      onClick: (e) => {
        dispatch(openDeleteWorkflowModal(workflow));
        setOpen(false);
        e.stopPropagation();
      },
    });
  }

  if (isDeletedUsingWorkspace) {
    menuItems.push({
      key: "freeup",
      content: "Free up disk",
      icon: "hdd",
      onClick: (e) => {
        dispatch(deleteWorkflow(id));
        setOpen(false);
        e.stopPropagation();
      },
    });
  }

  return (
    <div className={className || styles.container}>
      {menuItems.length > 0 && (
        <Popup
          basic
          trigger={
            <Icon
              name="ellipsis vertical"
              className={styles.icon}
              onClick={(e) => {
                setOpen(true);
                e.preventDefault();
              }}
            />
          }
          position="bottom left"
          on="click"
          open={open}
          onClose={() => setOpen(false)}
        >
          <Menu items={menuItems} secondary vertical />
        </Popup>
      )}
    </div>
  );
}

WorkflowActionsPopup.defaultProps = {
  className: "",
};

WorkflowActionsPopup.propTypes = {
  workflow: workflowShape.isRequired,
  className: PropTypes.string,
};
