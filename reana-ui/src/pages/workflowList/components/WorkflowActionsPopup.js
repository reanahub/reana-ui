/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import React, { useState } from "react";
import { Icon, Menu, Popup } from "semantic-ui-react";
import { useDispatch } from "react-redux";

import { workflowShape } from "~/props";
import { deleteWorkflow } from "~/actions";

import styles from "./WorkflowActionsPopup.module.scss";

export default function WorkflowActionsPopup({
  workflow,
  setOpenDeleteModal,
  setSelectedWorkflow,
}) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { id, name, run, size, status } = workflow;
  let menuItems = [];
  if (status === "deleted") {
    if (size !== "0K") {
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
  } else {
    menuItems.push({
      key: "delete",
      content: "Delete workflow",
      icon: "trash",
      onClick: (e) => {
        setOpenDeleteModal(true);
        setSelectedWorkflow({ id, name, run, size });
        setOpen(false);
        e.stopPropagation();
      },
    });
  }
  return (
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
  );
}

WorkflowActionsPopup.propTypes = {
  workflow: workflowShape.isRequired,
  setOpenDeleteModal: PropTypes.func.isRequired,
  setSelectedWorkflow: PropTypes.func.isRequired,
};
