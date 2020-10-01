/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Modal, Checkbox } from "semantic-ui-react";

import { deleteWorkflow } from "../../../actions";

export default function WorkflowDeleteModal({
  open,
  workflow,
  setOpenDeleteModal,
  setSelectedWorkflow,
}) {
  const dispatch = useDispatch();
  const [deleteWorkspace, setDeleteWorkspace] = useState(true);

  const onCloseModal = () => {
    setOpenDeleteModal(false);
    setSelectedWorkflow({});
    setDeleteWorkspace(true);
  };

  const { id, name, run, size } = workflow;
  return (
    <Modal open={open} onClose={onCloseModal} closeIcon>
      <Modal.Header>Delete workflow</Modal.Header>
      <Modal.Content>
        {
          <>
            <p>
              Are you sure you want to delete workflow "{name} #{run}"?
            </p>
            <Checkbox
              checked={deleteWorkspace}
              onChange={(_, data) => {
                setDeleteWorkspace(data.checked);
              }}
              label={`Delete also workflow workspace (free up ${size}) `}
            />
          </>
        }
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={() => {
            dispatch(deleteWorkflow(id, deleteWorkspace)).then(() => {
              onCloseModal();
            });
          }}
        >
          Delete
        </Button>
        <Button onClick={onCloseModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}

WorkflowDeleteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  workflow: PropTypes.object.isRequired,
  setOpenDeleteModal: PropTypes.func.isRequired,
  setSelectedWorkflow: PropTypes.func.isRequired,
};
