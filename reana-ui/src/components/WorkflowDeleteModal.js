/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useDispatch, useSelector } from "react-redux";
import { Button, Modal, Message, Icon } from "semantic-ui-react";

import { deleteWorkflow, closeDeleteWorkflowModal } from "~/actions";
import {
  getWorkflowDeleteModalOpen,
  getWorkflowDeleteModalItem,
} from "~/selectors";

export default function WorkflowDeleteModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowDeleteModalOpen);
  const workflow = useSelector(getWorkflowDeleteModalItem);

  if (!workflow) return null;

  const onCloseModal = () => {
    dispatch(closeDeleteWorkflowModal());
  };

  const { id, name, run, size } = workflow;
  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="small">
      <Modal.Header>Delete workflow</Modal.Header>
      <Modal.Content>
        <Message icon warning>
          <Icon name="warning circle" />
          <Message.Content>
            <Message.Header>Workspace deletion!</Message.Header>
            This action will delete also the workflow's workspace
            {size.human_readable ? ` (${size.human_readable})` : ""}. Please
            make sure to download all the files you want to keep before
            proceeding.
          </Message.Content>
        </Message>
        <p>
          Are you sure you want to delete workflow "{name} #{run}"?
        </p>
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={() => {
            dispatch(deleteWorkflow(id)).then(() => {
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
