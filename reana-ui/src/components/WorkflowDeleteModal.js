/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Checkbox, Icon, Message, Modal } from "semantic-ui-react";

import { closeDeleteWorkflowModal, deleteWorkflow } from "~/actions";
import client from "~/client";
import styles from "./WorkflowDeleteModal.module.css";
import {
  NON_DELETED_STATUSES,
  NON_FINISHED_STATUSES,
  WORKFLOW_RUNS_PREFETCH_PAGE_SIZE,
} from "~/config";
import {
  getWorkflowDeleteModalItem,
  getWorkflowDeleteModalOpen,
} from "~/selectors";

// Max number of runs to show inline in checkbox labels before truncating
const MAX_RUN_LABELS_SHOWN = 6;
const DELETE_RETRY_ATTEMPTS = 2;

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  String(err);

function DeleteWarningMessage({ sizeHumanReadable, hasRelatedRuns }) {
  return (
    <Message icon warning>
      <Icon name="warning circle" />
      <Message.Content>
        This action will delete also the workflow&apos;s workspace
        {sizeHumanReadable ? ` (${sizeHumanReadable})` : ""} and any open
        interactive session attached to it. Please make sure to download all the
        files you want to keep before proceeding.
        {hasRelatedRuns && (
          <>
            <br />
            <br />
            This workflow run has restarts. All restarts share the same
            workspace. Deleting this run would remove the shared workspace and
            leave the other runs in an inconsistent state. If you proceed, the
            related runs will also be marked as deleted.
          </>
        )}
      </Message.Content>
    </Message>
  );
}

function useWorkflowRuns({ open, name, run }) {
  const [state, setState] = useState({
    total: null,
    items: [],
    relatedIds: [],
    loading: false,
  });

  useEffect(() => {
    if (!open || !name) {
      setState({ total: null, items: [], relatedIds: [], loading: false });
      return;
    }

    let cancelled = false;
    const selectedFullName = run ? `${name}.${run}` : name;
    const selectedGroup = getWorkspaceGroup(selectedFullName);

    setState((s) => ({ ...s, loading: true }));

    client
      .getWorkflows({
        workflowIdOrName: name,
        status: NON_DELETED_STATUSES,
        pagination: { size: WORKFLOW_RUNS_PREFETCH_PAGE_SIZE, page: 1 },
      })
      .then((resp) => {
        if (cancelled) return;
        const items = resp.data.items || [];
        const relatedIds = selectedGroup
          ? items
              .filter((w) => getWorkspaceGroup(w?.name) === selectedGroup)
              .map((w) => w.id)
              .filter(Boolean)
          : [];
        setState({ total: resp.data.total, items, relatedIds, loading: false });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`Error while fetching runs for workflow ${name}`, err);
        setState({ total: null, items: [], relatedIds: [], loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [open, name, run]);

  return state;
}

// Returns the workspace group for a full workflow name
// helloworld-demo.1   -> helloworld-demo.1
// helloworld-demo.1.1 -> helloworld-demo.1
// helloworld-demo.1.2 -> helloworld-demo.1
const getWorkspaceGroup = (fullName) => {
  if (!fullName) return null;
  const parts = String(fullName).split(".");
  let i = parts.length - 1;
  while (i >= 0 && /^\d+$/.test(parts[i])) i--;
  const numeric = parts.slice(i + 1); // ["7","1"]
  const base = parts.slice(0, i + 1).join("."); // "helloworld-demo"
  if (!base || numeric.length === 0) return null;
  return `${base}.${numeric[0]}`; // first numeric suffix = original run
};

// Formats a full workflow run name into a short human-readable run label
// Examples:
// helloworld-demo.7   -> #7
// helloworld-demo.7.1 -> #7.1
const formatRunLabel = (fullName) => {
  if (!fullName) return "";
  const parts = String(fullName).split(".");
  let i = parts.length - 1;
  while (i >= 0 && /^\d+$/.test(parts[i])) i--;
  const numeric = parts.slice(i + 1).join("."); // "7.1"
  return numeric ? `#${numeric}` : String(fullName);
};

const formatRunList = (labels, max = MAX_RUN_LABELS_SHOWN) => {
  const xs = (labels || []).filter(Boolean);
  if (!xs.length) return "";
  const shown = xs.slice(0, max);
  const more = xs.length - shown.length;
  return more > 0 ? `${shown.join(", ")}, +${more} more` : shown.join(", ");
};

const deleteRunWithRetry = async (dispatch, workflowId, options) => {
  let lastError = null;

  for (let attempt = 1; attempt <= DELETE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      await dispatch(deleteWorkflow(workflowId, options));
      return;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
};

export default function WorkflowDeleteModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowDeleteModalOpen);
  const workflow = useSelector(getWorkflowDeleteModalItem);

  const [allRuns, setAllRuns] = useState(false);
  const [confirmRelatedDeletion, setConfirmRelatedDeletion] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { id, name, run, size } = workflow ?? {};
  const {
    total: allRunsTotal,
    items: allRunItems,
    relatedIds: relatedRunIds,
  } = useWorkflowRuns({ open, name, run });

  useEffect(() => {
    // reset local state on workflow change
    setAllRuns(false);
    setConfirmRelatedDeletion(false);
    setDeleteError(null);
    setIsDeleting(false);
  }, [id, open]);

  const hasRelatedRuns = relatedRunIds.length > 1;
  const showAllRunsCheckbox = Boolean(allRunsTotal && allRunsTotal > 1);
  const runsAreTruncated =
    typeof allRunsTotal === "number" && allRunsTotal > allRunItems.length;

  const onCloseModal = useCallback(() => {
    dispatch(closeDeleteWorkflowModal());
  }, [dispatch]);

  const selectedFullName = run ? `${name}.${run}` : name;
  const selectedGroup = getWorkspaceGroup(selectedFullName);

  const relatedRunLabels = useMemo(() => {
    if (!selectedGroup) return [];
    return (allRunItems || [])
      .filter((w) => getWorkspaceGroup(w?.name) === selectedGroup)
      .map((w) => formatRunLabel(w?.name));
  }, [allRunItems, selectedGroup]);

  const allRunLabels = useMemo(() => {
    return (allRunItems || []).map((w) => formatRunLabel(w?.name));
  }, [allRunItems]);

  const relatedRunListText = formatRunList(relatedRunLabels);
  const relatedRunListTitle = relatedRunLabels.join(", ");

  const allRunListText = formatRunList(allRunLabels);
  const allRunListTitle = allRunLabels.join(", ");

  const relatedCount = relatedRunIds?.length;
  const baseRun = String(run ?? "").split(".")[0]; // "7.1" -> "7"
  const runLabel = baseRun ? `${name}#${baseRun}` : name;
  const deleteButtonLabel = useMemo(() => {
    if (!name) return "Delete";
    if (allRuns) return `Delete ${allRunsTotal ?? "all"} runs of "${name}"`;
    if (hasRelatedRuns && confirmRelatedDeletion) {
      return `Delete ${relatedCount || "all"} restarts of "${runLabel}"`;
    }
    if (run !== undefined && run !== null && String(run) !== "") {
      return `Delete workflow "${name}#${run}"`;
    }
    return `Delete workflow "${name}"`;
  }, [
    allRuns,
    allRunsTotal,
    confirmRelatedDeletion,
    hasRelatedRuns,
    name,
    relatedCount,
    run,
    runLabel,
  ]);

  const onToggleAllRuns = useCallback((_, data) => {
    const checked = Boolean(data.checked);
    setAllRuns(checked);
    // If user opts to delete all runs, related runs are necessarily deleted too
    if (checked) setConfirmRelatedDeletion(true);
  }, []);

  const onDelete = useCallback(async () => {
    if (!id || isDeleting) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      // If user selected all runs, keep existing behavior
      if (allRuns) {
        await dispatch(
          deleteWorkflow(id, { allRuns: true, notifyError: false }),
        );
        onCloseModal();
        return;
      }

      // If this run has restarts, delete workspace once and mark related runs deleted too
      if (hasRelatedRuns) {
        if (!confirmRelatedDeletion) return;

        const activeRelatedRuns = (allRunItems || []).filter(
          (w) =>
            w?.id !== id &&
            getWorkspaceGroup(w?.name) === selectedGroup &&
            NON_FINISHED_STATUSES.includes(w?.status),
        );
        if (activeRelatedRuns.length > 0) {
          const activeLabels = activeRelatedRuns.map((w) =>
            formatRunLabel(w?.name),
          );
          setDeleteError(
            `Cannot delete this run and its restarts while some related restarts are still active. Active runs: ${formatRunList(
              activeLabels,
            )}. Please wait until they finish or stop them first, then retry.`,
          );
          return;
        }

        // Delete related runs first and the selected run last so a
        // failure leaves the first run available for a retry
        const orderedIds = [
          ...relatedRunIds.filter((otherId) => otherId !== id),
          id,
        ];

        for (const workflowId of orderedIds) {
          try {
            await deleteRunWithRetry(dispatch, workflowId, {
              allRuns: false,
              workspace: true,
              notifyError: false,
            });
          } catch (err) {
            const failedRun = (allRunItems || []).find(
              (x) => x?.id === workflowId,
            );
            const failedLabel = formatRunLabel(failedRun?.name) || workflowId;
            setDeleteError(
              `Could not delete ${failedLabel} after retrying. Any runs already marked as deleted will stay deleted, so retry deleting the remaining run(s).${
                err ? ` (${getErrorMessage(err)})` : ""
              }`,
            );
            return;
          }
        }

        onCloseModal();
        return;
      }

      // normal single run delete
      await dispatch(
        deleteWorkflow(id, {
          allRuns: false,
          workspace: true,
          notifyError: false,
        }),
      );
      onCloseModal();
    } catch (err) {
      console.error("Error deleting workflow", err);
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }, [
    allRuns,
    confirmRelatedDeletion,
    dispatch,
    hasRelatedRuns,
    id,
    isDeleting,
    onCloseModal,
    relatedRunIds,
    allRunItems,
    selectedGroup,
  ]);

  if (!workflow) return null;

  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="small">
      <Modal.Header>Delete workflow</Modal.Header>
      <Modal.Content>
        {deleteError && (
          <Message negative icon>
            <Icon name="times circle" />
            <Message.Content>
              <Message.Header>Deletion failed</Message.Header>
              {deleteError}
            </Message.Content>
          </Message>
        )}
        <DeleteWarningMessage
          sizeHumanReadable={size?.human_readable}
          hasRelatedRuns={hasRelatedRuns}
        />
        {runsAreTruncated && (
          <Message icon warning>
            <Icon name="warning sign" />
            <Message.Content>
              Only the first {allRunItems.length} non-deleted runs were loaded
              for this dialog, but {allRunsTotal} runs exist. Some related
              restarts may not be listed here and may not be deleted together.
            </Message.Content>
          </Message>
        )}
        {hasRelatedRuns && (
          <Checkbox
            label={
              <label title={relatedRunListTitle}>
                Delete all the restarts of the workflow ({relatedRunListText})
              </label>
            }
            onChange={(_, data) =>
              setConfirmRelatedDeletion(Boolean(data.checked))
            }
            checked={confirmRelatedDeletion}
            disabled={allRuns || isDeleting}
          />
        )}
        {showAllRunsCheckbox && (
          <div
            className={
              hasRelatedRuns ? styles.allRunsCheckboxSpacing : undefined
            }
          >
            <Checkbox
              label={
                <label title={allRunListTitle}>
                  Delete all the runs of the workflow (
                  {allRunListText || allRunsTotal || "all"})
                </label>
              }
              onChange={onToggleAllRuns}
              checked={allRuns}
              disabled={isDeleting}
            />
          </div>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          loading={isDeleting}
          disabled={
            isDeleting ||
            (hasRelatedRuns && !allRuns && !confirmRelatedDeletion)
          }
          onClick={onDelete}
        >
          {deleteButtonLabel}
        </Button>
        <Button onClick={onCloseModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
