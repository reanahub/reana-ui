/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Icon, Message, Modal } from "semantic-ui-react";

import client from "~/client";
import { useNotification } from "~/NotificationContext";
import { ParsedWorkflow } from "~/util";

interface Props {
  workflow: ParsedWorkflow;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkflowPruneModal({
  workflow,
  isOpen,
  onClose,
}: Props) {
  const { notify, notifyError } = useNotification();
  const queryClient = useQueryClient();
  const [includeInputs, setIncludeInputs] = useState<boolean>(false);
  const [includeOutputs, setIncludeOutputs] = useState<boolean>(false);

  const { id, name, run } = workflow;
  const size = workflow.size as { human_readable?: string } | undefined;

  useEffect(() => {
    setIncludeInputs(false);
    setIncludeOutputs(false);
  }, [id, isOpen]);

  const handlePrune = async () => {
    try {
      const resp = await client.pruneWorkspace(id, {
        includeInputs,
        includeOutputs,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      notify("Success!", (resp.data as any).message);
      onClose();
    } catch (err) {
      notifyError(err);
      // Keep modal open on error
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} closeIcon size="small">
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
          onChange={(e: React.FormEvent, data: { checked?: boolean }) =>
            setIncludeInputs(data.checked ?? false)
          }
          checked={includeInputs}
        />
        <div style={{ height: "0.75rem" }} />
        <Checkbox
          label={<label>Also delete workflow outputs</label>}
          onChange={(e: React.FormEvent, data: { checked?: boolean }) =>
            setIncludeOutputs(data.checked ?? false)
          }
          checked={includeOutputs}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={handlePrune}>
          Prune "{name}#{run}"
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
