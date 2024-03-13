/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Modal,
  Icon,
  Popup,
  Checkbox,
  Dropdown,
  TextArea,
  Loader,
  Message,
  Confirm,
} from "semantic-ui-react";

import {
  closeShareWorkflowModal,
  fetchWorkflowShareStatus,
  shareWorkflow,
  unshareWorkflow,
} from "~/actions";
import {
  getLoadingWorkflowShare,
  getLoadingWorkflowShareStatus,
  getLoadingWorkflowUnshare,
  getUnshareError,
  getUserId,
  getUserWorkflowWasUnsharedWith,
  getUsersWorkflowWasNotSharedWith,
  getUsersWorkflowWasSharedWith,
  getWorkflowShareModalItem,
  getWorkflowShareModalOpen,
  getWorkflowShareStatus,
} from "~/selectors";

import styles from "./WorkflowShareModal.module.scss";
import SemanticDatepicker from "react-semantic-ui-datepickers";

export default function WorkflowShareModal() {
  const dispatch = useDispatch();
  const open = useSelector(getWorkflowShareModalOpen);
  const workflow = useSelector(getWorkflowShareModalItem);
  const [linkCopied, setLinkCopied] = useState(false);
  const [dropDownOptions, setDropDownOptions] = useState([]);
  const [usersToShareWith, setUsersToShareWith] = useState([]);
  const [expirationModalOpen, setExpirationModalOpen] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [neverExpires, setNeverExpires] = useState(true);
  const [workflowShares, setWorkflowShares] = useState([]);
  const workflowShareStatus = useSelector(getWorkflowShareStatus(workflow?.id));
  const [workflowShareStatusLoading, setWorkflowShareStatusLoading] =
    useState(false);
  const loadingWorkflowShareStatus = useSelector(getLoadingWorkflowShareStatus);

  const loadingWorkflowShare = useSelector(getLoadingWorkflowShare);
  const loadingWorkflowUnshare = useSelector(getLoadingWorkflowUnshare);
  const [unshareError, setUnshareError] = useState(null);
  const workflowUnshareError = useSelector(getUnshareError);
  const [usersSharedWith, setUsersSharedWith] = useState([]);
  const usersWorkflowWasSharedWith = useSelector(getUsersWorkflowWasSharedWith);
  const [usersNotSharedWith, setUsersNotSharedWith] = useState([]);
  const usersWorkflowWasNotSharedWith = useSelector(
    getUsersWorkflowWasNotSharedWith,
  );
  const [confirmUnshareOpen, setConfirmUnshareOpen] = useState(false);
  const [userToUnshareWith, setUserToUnshareWith] = useState(null);
  const [userUnsharedWith, setUserUnsharedWith] = useState(null);
  const userWorkflowWasUnsharedWith = useSelector(
    getUserWorkflowWasUnsharedWith,
  );
  const userId = useSelector(getUserId);

  const resetMessages = () => {
    setUsersSharedWith([]);
    setUsersNotSharedWith([]);
    setUserUnsharedWith(null);
    setUnshareError(null);
  };

  useEffect(() => {
    resetMessages();
  }, [open]);

  useEffect(() => {
    if (workflow) {
      dispatch(fetchWorkflowShareStatus(workflow.id));
    }
  }, [dispatch, workflow]);

  useEffect(() => {
    if (!workflowShareStatus) return;
    setWorkflowShares(workflowShareStatus);
  }, [workflowShareStatus]);

  useEffect(() => {
    setWorkflowShareStatusLoading(loadingWorkflowShareStatus);
  }, [loadingWorkflowShareStatus]);

  useEffect(() => {
    if (!loadingWorkflowShare) {
      setUsersSharedWith(usersWorkflowWasSharedWith);
      setUsersNotSharedWith(usersWorkflowWasNotSharedWith);
      setUserUnsharedWith(null);
      setUsersToShareWith([]);
      if (workflow) dispatch(fetchWorkflowShareStatus(workflow.id));
    }
    // disable eslint because we want to run this effect only when
    // loadingWorkflowShare changes, for further context:
    // https://github.com/facebook/create-react-app/issues/6880#issuecomment-485963251
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingWorkflowShare]);

  useEffect(() => {
    if (!loadingWorkflowUnshare) {
      if (workflow) dispatch(fetchWorkflowShareStatus(workflow.id));

      if (!workflowUnshareError) {
        setUserUnsharedWith(userWorkflowWasUnsharedWith);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingWorkflowUnshare]);

  useEffect(() => {
    setUnshareError(workflowUnshareError);
    if (workflowUnshareError) {
      setUsersSharedWith([]);
      setUsersNotSharedWith([]);
      if (workflow) dispatch(fetchWorkflowShareStatus(workflow.id));
    }
  }, [workflowUnshareError, dispatch, workflow]);

  if (!workflow) return null;

  const onCloseModal = () => {
    dispatch(closeShareWorkflowModal());
    resetMessages();
  };

  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(window.location.href);
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

  const handleShareWorkflow = () => {
    resetMessages();
    if (usersToShareWith.length === 0) {
      return;
    }

    dispatch(
      shareWorkflow(
        workflow.id,
        userId,
        usersToShareWith,
        expirationDate?.toLocaleDateString("sv-SE", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      ),
    );
  };

  const handleUnshareWorkflow = (userToUnshareWith) => {
    setConfirmUnshareOpen(false);
    setUsersSharedWith([]);
    setUsersNotSharedWith([]);
    setUserUnsharedWith(null);
    dispatch(unshareWorkflow(workflow.id, userId, userToUnshareWith));
  };

  const { name, run } = workflow;
  return (
    <Modal
      open={open}
      onClose={onCloseModal}
      closeIcon
      size="tiny"
      id={styles["workflow-share-modal"]}
    >
      <Modal.Header>
        Share {name} #{run}
      </Modal.Header>

      <Modal.Content>
        <Dropdown
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
          disabled={loadingWorkflowShare}
        />

        <div className="ui form" id={styles["message"]}>
          <TextArea placeholder="Message (optional)" />
        </div>
        <div id={styles["share-buttons"]}>
          <div id={styles["share-button"]}>
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
                    onClick={() => {
                      handleShareWorkflow();
                    }}
                    disabled={usersToShareWith.length === 0}
                  >
                    <Icon name="share alternate" />
                    Share
                  </Button>
                </span>
              }
            />

            {loadingWorkflowShare && (
              <Loader inline id={styles["loader-share-workflow"]} inverted />
            )}
          </div>
          <Popup
            content={"Expires"}
            position="top center"
            trigger={
              <Button
                onClick={openExpirationModal}
                icon
                labelPosition="left"
                id={styles["expiration-date-button"]}
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

        {usersSharedWith.length > 0 && (
          <Message success>
            <Message.Header>
              {name} #{run} is now shared with
            </Message.Header>
            <Message.List>
              {usersSharedWith.map((user_email, index) => (
                <Message.Item key={index}>{user_email}</Message.Item>
              ))}
            </Message.List>
          </Message>
        )}

        {usersNotSharedWith.length > 0 && (
          <Message error>
            <Message.Header>
              {name} #{run} could not be shared with
            </Message.Header>
            <Message.List>
              {usersNotSharedWith.map((failure, index) => (
                <Message.Item key={index}>
                  {failure.user_email_to_share_with}: {failure.error_message}
                </Message.Item>
              ))}
            </Message.List>
          </Message>
        )}

        {userUnsharedWith && (
          <Message success>
            {name} #{run} is no longer shared with {userUnsharedWith}
          </Message>
        )}

        {unshareError && (
          <Message error>
            An error occurred while unsharing {name} #{run}: {unshareError}
          </Message>
        )}

        <Modal
          open={expirationModalOpen}
          onClose={closeExpirationModal}
          closeIcon
          size="mini"
          id={styles["expiration-date-modal"]}
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
          <Modal.Actions id={styles["expiration-modal-actions"]}>
            <Button
              primary
              onClick={handleSetExpirationDate}
              className="aligned left"
              id={styles["expiration-modal-set-button"]}
            >
              Set
            </Button>
          </Modal.Actions>
        </Modal>

        {loadingWorkflowUnshare && (
          <Loader inline id={styles["loader-unshare-workflow"]} inverted />
        )}

        <h3 id={styles["read-only-header"]}>Read-only access</h3>

        {workflowShareStatusLoading ? (
          <Loader inline id={styles["loader-share-status"]} inverted />
        ) : (
          <>
            {workflowShares.length > 0 ? (
              <div>
                {workflowShares.map((share, index) => (
                  <div key={index} id={styles["share-item"]}>
                    <div>
                      <Icon
                        name="user"
                        size="big"
                        id={styles["share-user-icon"]}
                      />
                      {share.user_email}
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
                              {share.valid_until
                                ? share.valid_until.substring(0, 10)
                                : "Never"}
                            </Button>
                          </span>
                        }
                      />

                      <Popup
                        content={"Unshare"}
                        position="top center"
                        trigger={
                          <Button
                            size="tiny"
                            icon
                            negative
                            onClick={() => {
                              setConfirmUnshareOpen(true);
                              setUserToUnshareWith(share.user_email);
                            }}
                          >
                            <Icon name="trash" />
                          </Button>
                        }
                      />
                      <Confirm
                        size="mini"
                        open={confirmUnshareOpen}
                        header="Unshare workflow"
                        content={`Are you sure you want to unshare ${name} #${run} with ${userToUnshareWith}?`}
                        onCancel={() => setConfirmUnshareOpen(false)}
                        onConfirm={() =>
                          handleUnshareWorkflow(userToUnshareWith)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Message info id={styles["no-share-message"]}>
                This workflow has not been shared with anyone yet.
              </Message>
            )}
          </>
        )}
      </Modal.Content>
      <Modal.Actions id={styles["sharing-modal-actions"]}>
        <Popup
          content={"Link copied!"}
          open={linkCopied}
          position="top center"
          trigger={
            <Button
              icon
              labelPosition="left"
              onClick={copyCurrentUrl}
              className="left floated"
              id={styles["copy-link-button"]}
            >
              <Icon name="linkify" />
              Copy link
            </Button>
          }
        />
        <Button onClick={onCloseModal} id={styles["done-button"]}>
          Done
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
