/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Checkbox, Icon, Message, Modal } from "semantic-ui-react";

import { closePruneWorkflowModal, pruneWorkspace } from "~/actions";
import {
  getWorkflowPruneModalItem,
  getWorkflowPruneModalOpen,
} from "~/selectors";

export default function WorkflowPruneModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowPruneModalOpen);
  const workflow = useSelector(getWorkflowPruneModalItem);

  const [includeInputs, setIncludeInputs] = useState(false);
  const [includeOutputs, setIncludeOutputs] = useState(false);

  const { id, name, run, size } = workflow ?? {};

  useEffect(() => {
    // reset local state on workflow change
    setIncludeInputs(false);
    setIncludeOutputs(false);
  }, [id]);

  if (!workflow) return null;

  const onCloseModal = () => {
    dispatch(closePruneWorkflowModal());
  };

  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="small">
      <Modal.Header>Prune workspace</Modal.Header>
      <Modal.Content>
        <Message icon warning>
          <Icon name="warning circle" />
          <Message.Content>
            This action will delete all workspace files produced by this run
            (and any restarts). Only the workflow inputs and outputs will be
            kept.
            {size?.human_readable
              ? ` Current workspace size: ${size.human_readable}.`
              : ""}
          </Message.Content>
        </Message>

        <Checkbox
          label={<label>Also delete workflow inputs</label>}
          onChange={(e, data) => setIncludeInputs(data.checked)}
          checked={includeInputs}
        />
        <div style={{ height: "0.75rem" }} />
        <Checkbox
          label={<label>Also delete workflow outputs</label>}
          onChange={(e, data) => setIncludeOutputs(data.checked)}
          checked={includeOutputs}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={async () => {
            try {
              await dispatch(
                pruneWorkspace(id, { includeInputs, includeOutputs }),
              );
              onCloseModal(); // close only on success
            } catch (e) {
              // keep modal open on error, notification is handled already
            }
          }}
        >
          Prune "{name}#{run}"
        </Button>
        <Button onClick={onCloseModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
