/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import PropTypes from "prop-types";
import { Icon, Menu, Popup } from "semantic-ui-react";
import { useDispatch } from "react-redux";

import { workflowShape } from "~/props";
import {
  deleteWorkflow,
  openInteractiveSession,
  closeInteractiveSession,
  openDeleteWorkflowModal,
  triggerNotification,
} from "~/actions";

import { JupyterNotebookIcon } from "~/components";

import styles from "./WorkflowActionsPopup.module.scss";

const JupyterIcon = <JupyterNotebookIcon className={styles["jupyter-icon"]} />;

export default function WorkflowActionsPopup({ workflow, className }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { id, size, status, session_status: sessionStatus } = workflow;
  const isDeleted = status === "deleted";
  const isDeletedUsingWorkspace = isDeleted && size !== "0K";
  const isSessionOpen = sessionStatus === "created";

  let menuItems = [];

  if (!isDeleted && !isSessionOpen) {
    menuItems.push({
      key: "openNotebook",
      content: "Open Jupyter Notebook",
      icon: JupyterIcon,
      onClick: (e) => {
        dispatch(openInteractiveSession(id)).then(() => {
          dispatch(
            triggerNotification(
              "Success!",
              "The interactive session has been created. However, it could take several minutes to start the Jupyter Notebook."
            )
          );
        });
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

  if (!isDeleted) {
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
        dispatch(deleteWorkflow(id, true));
        setOpen(false);
        e.stopPropagation();
      },
    });
  }

  return (
    <div className={className || styles.container}>
      {(!isDeleted || isDeletedUsingWorkspace) && (
        <Popup
          basic
          trigger={
            <Icon
              name="ellipsis vertical"
              className={styles.icon}
              onClick={(e) => {
                setOpen(true);
                e.stopPropagation();
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
