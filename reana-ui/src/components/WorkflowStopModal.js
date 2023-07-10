/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useDispatch, useSelector } from "react-redux";
import { Button, Modal, Message, Icon } from "semantic-ui-react";

import { stopWorkflow, closeStopWorkflowModal } from "~/actions";
import {
  getWorkflowStopModalOpen,
  getWorkflowStopModalItem,
} from "~/selectors";

export default function WorkflowStopModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowStopModalOpen);
  const workflow = useSelector(getWorkflowStopModalItem);

  if (!workflow) return null;

  const onCloseModal = () => {
    dispatch(closeStopWorkflowModal());
  };

  const { id, name, run } = workflow;
  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="small">
      <Modal.Header>Stop workflow</Modal.Header>
      <Modal.Content>
        <Message icon warning>
          <Icon name="warning circle" />
          <Message.Content>
            This action will stop the workflow, without waiting for running jobs
            to finish. Please make sure that there is no need to keep the
            workflow running.
          </Message.Content>
        </Message>
        <p>
          Are you sure you want to stop the workflow "{name} #{run}"?
        </p>
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={() => {
            dispatch(stopWorkflow(id)).then(onCloseModal);
          }}
        >
          Stop
        </Button>
        <Button onClick={onCloseModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
