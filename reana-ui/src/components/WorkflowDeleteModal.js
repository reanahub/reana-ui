/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Checkbox, Icon, Message, Modal } from "semantic-ui-react";

import { closeDeleteWorkflowModal, deleteWorkflow } from "~/actions";
import client from "~/client";
import { NON_DELETED_STATUSES } from "~/config";
import {
  getWorkflowDeleteModalItem,
  getWorkflowDeleteModalOpen,
} from "~/selectors";

export default function WorkflowDeleteModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowDeleteModalOpen);
  const workflow = useSelector(getWorkflowDeleteModalItem);
  const [allRuns, setAllRuns] = useState(false);
  const [allRunsTotal, setAllRunsTotal] = useState();

  const { id, name, run, size } = workflow ?? {};

  useEffect(() => {
    // reset local state on workflow change
    setAllRuns(false);
    setAllRunsTotal(null);
  }, [id]);

  useEffect(() => {
    if (!name) {
      return;
    }

    client
      .getWorkflows({
        workflowIdOrName: name,
        status: NON_DELETED_STATUSES,
        // request minimum number of workflows as we are only interested in `total`
        pagination: { size: 1, page: 1 },
      })
      .then((resp) => setAllRunsTotal(resp.data.total))
      .catch((err) =>
        console.log(
          `Error while fetching number of workflows with name ${name}`,
          err,
        ),
      );
  }, [name]);

  if (!workflow) return null;

  const onCloseModal = () => {
    dispatch(closeDeleteWorkflowModal());
  };

  const deleteButtonLabel = allRuns
    ? `Delete ${allRunsTotal ?? "all"} workflows named "${name}"`
    : `Delete workflow "${name}#${run}"`;

  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="small">
      <Modal.Header>Delete workflow</Modal.Header>
      <Modal.Content>
        <Message icon warning>
          <Icon name="warning circle" />
          <Message.Content>
            <Message.Header>
              Deletion of workspace and interactive sessions!
            </Message.Header>
            This action will delete also the workflow's workspace
            {size.human_readable ? ` (${size.human_readable})` : ""} and any
            open interactive session attached to it. Please make sure to
            download all the files you want to keep before proceeding.
          </Message.Content>
        </Message>
        <Checkbox
          label={
            <label>
              Delete all the runs of the workflow{" "}
              {allRunsTotal ? `(${allRunsTotal})` : ""}
            </label>
          }
          onChange={(e, data) => setAllRuns(data.checked)}
          checked={allRuns}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={() => {
            dispatch(deleteWorkflow(id, { allRuns })).then(() => {
              onCloseModal();
            });
          }}
        >
          {deleteButtonLabel}
        </Button>
        <Button onClick={onCloseModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
