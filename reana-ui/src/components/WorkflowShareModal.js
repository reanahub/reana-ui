/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SemanticDatepicker from "react-semantic-ui-datepickers";
import {
  Button,
  Checkbox,
  Confirm,
  Form,
  Header,
  Icon,
  Loader,
  Message,
  Modal,
  Popup,
} from "semantic-ui-react";

import { closeShareWorkflowModal, fetchWorkflowShareStatus } from "~/actions";
import client from "~/client";
import {
  getLoadingWorkflowShareStatus,
  getWorkflowShareModalItem,
  getWorkflowShareModalOpen,
  getWorkflowShareStatus,
} from "~/selectors";

import styles from "./WorkflowShareModal.module.scss";

function WorkflowShareStatus({
  workflow,
  handleUnshareWorkflowSuccess,
  handleUnshareWorkflowError,
}) {
  const dispatch = useDispatch();
  const loadingWorkflowShareStatus = useSelector(getLoadingWorkflowShareStatus);
  const workflowShareStatus = useSelector(getWorkflowShareStatus(workflow?.id));

  const [loadingUnshareWorkflow, setLoadingUnshareWorkflow] = useState(false);
  const [confirmUnshareOpen, setConfirmUnshareOpen] = useState(false);
  const [userToUnshareWith, setUserToUnshareWith] = useState(null);
  const { name, run, id } = workflow;

  useEffect(() => {
    if (workflow) {
      dispatch(fetchWorkflowShareStatus(workflow.id));
    }
  }, [dispatch, workflow]);

  const handleUnshareWorkflow = (userEmailToUnshareWith) => {
    setLoadingUnshareWorkflow(true);
    client
      .unshareWorkflow(id, {
        userEmailToUnshareWith,
      })
      .then(() => {
        dispatch(fetchWorkflowShareStatus(id));
        handleUnshareWorkflowSuccess(userEmailToUnshareWith);
        setLoadingUnshareWorkflow(false);
        setConfirmUnshareOpen(false);
      })
      .catch((err) => {
        const errorMessage = err.response.data.message;
        handleUnshareWorkflowError(errorMessage);
        setLoadingUnshareWorkflow(false);
        setConfirmUnshareOpen(false);
      });
  };

  return (
    <div>
      <Header as="h3">Read-only access</Header>
      {loadingWorkflowShareStatus ? (
        <Loader inline className={styles["loader-share-status"]} inverted />
      ) : (
        <>
          {workflowShareStatus?.length > 0 ? (
            <div>
              {workflowShareStatus.map((share, index) => (
                <div key={index} className={styles["share-item"]}>
                  <div>
                    <Icon
                      name="user"
                      size="big"
                      className={styles["share-user-icon"]}
                    />
                    {share.userEmail}
                  </div>
                  <div>
                    <Popup
                      content={"Expires"}
                      position="top center"
                      disabled={false}
                      trigger={
                        <span>
                          <Button
                            size="tiny"
                            icon
                            labelPosition="left"
                            disabled
                          >
                            <Icon name="clock" />
                            {share.validUntil
                              ? share.validUntil.substring(0, 10)
                              : "Never"}
                          </Button>
                        </span>
                      }
                    />

                    <Popup
                      content="Unshare"
                      position="top center"
                      trigger={
                        <Button
                          size="tiny"
                          icon
                          negative
                          onClick={() => {
                            setUserToUnshareWith(share.userEmail);
                            setConfirmUnshareOpen(true);
                          }}
                          disabled={loadingUnshareWorkflow}
                          loading={loadingUnshareWorkflow}
                        >
                          <Icon name="trash" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
              <Confirm
                size="mini"
                open={confirmUnshareOpen}
                header="Unshare workflow"
                content={`Are you sure you want to unshare ${name} #${run} with ${userToUnshareWith}?`}
                onCancel={() => {
                  setConfirmUnshareOpen(false);
                  setUserToUnshareWith(null);
                }}
                onConfirm={() => handleUnshareWorkflow(userToUnshareWith)}
              />
            </div>
          ) : (
            <Message info>
              This workflow has not been shared with anyone yet.
            </Message>
          )}
        </>
      )}
    </div>
  );
}

export default function WorkflowShareModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowShareModalOpen);
  const workflow = useSelector(getWorkflowShareModalItem);
  const [linkCopied, setLinkCopied] = useState(false);
  const [dropDownOptions, setDropDownOptions] = useState([]);
  const [usersToShareWith, setUsersToShareWith] = useState([]);
  const [message, setMessage] = useState("");
  const [expirationModalOpen, setExpirationModalOpen] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [neverExpires, setNeverExpires] = useState(true);

  const [loadingShareWorkflow, setLoadingShareWorkflow] = useState(false);
  const [lastSharingAction, setLastSharingAction] = useState({});

  const resetShareForm = useCallback(() => {
    setUsersToShareWith([]);
    setMessage("");
    setExpirationModalOpen(false);
    setExpirationDate(null);
    setNeverExpires(true);
  }, []);

  const resetState = useCallback(() => {
    resetShareForm();
    setLinkCopied(false);
    setDropDownOptions([]);
    setLoadingShareWorkflow(false);
    setLastSharingAction({});
  }, [resetShareForm]);

  useEffect(() => {
    resetState();
  }, [workflow, open, resetState]);

  if (!workflow) return null;

  const onCloseModal = () => {
    dispatch(closeShareWorkflowModal());
    resetState();
  };

  const copyCurrentUrl = () => {
    const detailsURL = new URL(`/details/${workflow.id}`, window.location.href);
    navigator.clipboard.writeText(detailsURL.toString());
    setLinkCopied(true);

    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };

  const handleAddition = (e, { value }) => {
    setDropDownOptions((prevOptions) => [
      { text: value, value },
      ...prevOptions,
    ]);
  };

  const handleChange = (e, { value }) => {
    setUsersToShareWith(value);
  };

  const openExpirationModal = () => {
    setExpirationModalOpen(true);
  };

  const closeExpirationModal = () => {
    setExpirationModalOpen(false);
  };

  const handleChangeExpirationDate = (_, data) => setExpirationDate(data.value);

  const handleSetExpirationDate = () => {
    if (neverExpires || !expirationDate) {
      setExpirationDate(null);
      setNeverExpires(true);
    } else {
      setExpirationDate(expirationDate);
    }
    setExpirationModalOpen(false);
  };

  const handleShareWorkflow = (usersToShareWith) => {
    if (usersToShareWith.length === 0) {
      return;
    }

    const id = workflow.id;
    const validUntil = expirationDate?.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const usersSharedWith = [];
    const usersNotSharedWith = [];
    const requests = [];

    setLoadingShareWorkflow(true);

    for (const userEmailToShareWith of usersToShareWith) {
      const req = client
        .shareWorkflow(id, {
          userEmailToShareWith,
          validUntil,
        })
        .then(() => {
          usersSharedWith.push(userEmailToShareWith);
        })
        .catch((err) => {
          const errorMessage = err.response.data.message;
          usersNotSharedWith.push({
            userEmailToShareWith,
            errorMessage,
          });
        });

      requests.push(req);
    }

    Promise.allSettled(requests).then(() => {
      // update share status
      dispatch(fetchWorkflowShareStatus(id));
      // reset form and share button
      resetShareForm();
      setLoadingShareWorkflow(false);
      // set results of last sharing action
      setLastSharingAction({
        usersSharedWith,
        usersNotSharedWith,
      });
    });
  };

  const { name, run } = workflow;
  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="tiny">
      <Modal.Header>
        Share {name} #{run}
      </Modal.Header>

      <Modal.Content>
        <Form>
          <Form.Dropdown
            options={dropDownOptions}
            placeholder="Emails of users to share with"
            search
            selection
            fluid
            allowAdditions
            multiple
            noResultsMessage={null}
            value={usersToShareWith}
            onAddItem={handleAddition}
            onChange={handleChange}
            disabled={loadingShareWorkflow}
          />

          <Form.TextArea
            placeholder="Message (optional)"
            disabled={loadingShareWorkflow}
            value={message}
            onChange={(_, { value }) => setMessage(value)}
          />
          <div className={styles["share-buttons"]}>
            <Popup
              content={
                "Please provide at least one user to share the workflow with."
              }
              position="top center"
              disabled={usersToShareWith.length > 0}
              trigger={
                <span>
                  <Button
                    primary
                    icon
                    labelPosition="left"
                    onClick={() => handleShareWorkflow(usersToShareWith)}
                    disabled={
                      usersToShareWith.length === 0 || loadingShareWorkflow
                    }
                    loading={loadingShareWorkflow}
                  >
                    <Icon name="share alternate" />
                    Share
                  </Button>
                </span>
              }
            />
            <Popup
              content={"Expires"}
              position="top center"
              trigger={
                <Button
                  onClick={openExpirationModal}
                  icon
                  labelPosition="left"
                  className={styles["expiration-date-button"]}
                >
                  <Icon name="clock" />
                  {neverExpires || !expirationDate
                    ? "Never"
                    : expirationDate?.toLocaleDateString("sv-SE", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                </Button>
              }
            />
          </div>
        </Form>

        {lastSharingAction.usersSharedWith?.length > 0 && (
          <Message success>
            <Message.Header>
              {name} #{run} is now shared with
            </Message.Header>
            <Message.List>
              {lastSharingAction.usersSharedWith.map((userEmail, index) => (
                <Message.Item key={index}>{userEmail}</Message.Item>
              ))}
            </Message.List>
          </Message>
        )}

        {lastSharingAction.usersNotSharedWith?.length > 0 && (
          <Message error>
            <Message.Header>
              {name} #{run} could not be shared with
            </Message.Header>
            <Message.List>
              {lastSharingAction.usersNotSharedWith.map((failure, index) => (
                <Message.Item key={index}>
                  {failure.userEmailToShareWith}: {failure.errorMessage}
                </Message.Item>
              ))}
            </Message.List>
          </Message>
        )}

        {lastSharingAction?.userUnsharedWith && (
          <Message success>
            {name} #{run} is no longer shared with{" "}
            {lastSharingAction.userUnsharedWith}
          </Message>
        )}
        {lastSharingAction?.unshareError && (
          <Message error>
            An error occurred while unsharing {name} #{run}:{" "}
            {lastSharingAction.unshareError}
          </Message>
        )}

        <Modal
          open={expirationModalOpen}
          onClose={closeExpirationModal}
          closeIcon
          size="mini"
        >
          <Modal.Header>Set expiration date</Modal.Header>
          <Modal.Content>
            <Checkbox
              label="Never expires"
              checked={neverExpires}
              onChange={() => {
                setNeverExpires(!neverExpires);
                if (!neverExpires) {
                  setExpirationDate(null);
                }
              }}
              style={{ marginBottom: "1.5em" }}
            />
            <SemanticDatepicker
              onChange={handleChangeExpirationDate}
              disabled={neverExpires}
              value={expirationDate}
              locale="en-US"
              minDate={new Date()}
            />
          </Modal.Content>
          <Modal.Actions className={styles["expiration-modal-actions"]}>
            <Button
              primary
              onClick={handleSetExpirationDate}
              className={styles["expiration-modal-set-button"]}
            >
              Set
            </Button>
          </Modal.Actions>
        </Modal>

        <WorkflowShareStatus
          workflow={workflow}
          handleUnshareWorkflowError={(err) => {
            setLastSharingAction({ unshareError: err });
          }}
          handleUnshareWorkflowSuccess={(user) => {
            setLastSharingAction({ userUnsharedWith: user });
          }}
        />
      </Modal.Content>
      <Modal.Actions className={styles["sharing-modal-actions"]}>
        <Popup
          content={"Link copied!"}
          open={linkCopied}
          position="top center"
          trigger={
            <Button
              icon
              labelPosition="left"
              onClick={copyCurrentUrl}
              className={`left floated ${styles["copy-link-button"]}`}
            >
              <Icon name="linkify" />
              Copy link
            </Button>
          }
        />
        <Button onClick={onCloseModal} className={styles["done-button"]}>
          Done
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
