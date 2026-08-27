/*
	-*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEmpty from "lodash/isEmpty";
import { useCallback, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, List, Loader, Radio, Message, Icon } from "semantic-ui-react";

import {
  errorActionCreator,
  GITLAB_WEBHOOK_TOKEN_UPDATED,
  loadGitlabWebhookTokenStatus,
} from "~/actions";
import client, { GITLAB_AUTH_URL } from "~/client";
import { Search, Pagination } from "~/components";
import {
  nextWebhookAuthorizationTransition,
  webhookAuthorizationIsExpired,
} from "~/components/WebhookExpiryWarning";
import {
  getGitlabWebhookToken,
  getGitlabWebhookTokenRequest,
} from "~/selectors";

import styles from "./GitLabProjects.module.scss";

export default function GitLabProjects() {
  const DEFAULT_PAGINATION = { page: 1, size: 10 };
  const dispatch = useDispatch();

  const [projects, setProjects] = useState(null);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [searchFilter, setSearchFilter] = useState(null);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [totalPages, setTotalPages] = useState(0);
  const [renewingWebhookToken, setRenewingWebhookToken] = useState(false);
  const [webhookNow, setWebhookNow] = useState(Date.now());
  const [webhookTokenRenewalError, setWebhookTokenRenewalError] =
    useState(null);
  const webhookToken = useSelector(getGitlabWebhookToken);
  const { phase: webhookTokenPhase } = useSelector(
    getGitlabWebhookTokenRequest,
  );
  const webhookTokenExpired = webhookAuthorizationIsExpired(
    webhookToken,
    webhookNow,
  );

  // keep track of last fetch request in order to avoid
  // updating the state with out-of-order responses
  const lastFetchRequest = useRef(null);

  const fetchWebhookTokenStatus = useCallback(
    () => dispatch(loadGitlabWebhookTokenStatus()),
    [dispatch],
  );

  useEffect(() => {
    const transitionAt = nextWebhookAuthorizationTransition(
      webhookToken,
      webhookNow,
    );
    if (transitionAt === null) return undefined;
    const timer = window.setTimeout(
      () => setWebhookNow(Date.now()),
      Math.min(transitionAt - webhookNow, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [webhookToken, webhookNow]);

  useEffect(() => {
    // Fetch project list
    setFetchingProjects(true);
    let request = client.getGitlabProjects({
      pagination,
      search: searchFilter,
    });
    lastFetchRequest.current = request;

    request
      .then((res) => {
        if (request !== lastFetchRequest.current) {
          // this is not the last request, so ignore it
          return;
        }
        let newProjects = {};
        for (const project of res.data.items) {
          newProjects[project.id] = { ...project, toggling: false };
        }
        setProjects(newProjects);
        const newTotalPages =
          res.data.total != null
            ? Math.ceil(res.data.total / pagination.size)
            : res.data.has_next
              ? pagination.page + 1
              : pagination.page;
        setTotalPages(newTotalPages);
        setFetchingProjects(false);
      })
      .catch((e) => {
        if (lastFetchRequest.current !== request) {
          // this is not the last request, so ignore it
          return;
        }
        setProjects(null);
        setTotalPages(0);
        setFetchingProjects(false);
      });
  }, [searchFilter, pagination]);

  const setToggling = (projectId, toggling) => {
    setProjects((currentProjects) => ({
      ...currentProjects,
      [projectId]: {
        ...currentProjects[projectId],
        toggling,
      },
    }));
  };

  const onToggleProject = (_, { value: projectId, checked }) => {
    setToggling(projectId, true);

    let data = { project_id: projectId };
    let method, expectedStatus;

    if (checked) {
      method = "post";
      expectedStatus = 201;
    } else {
      method = "delete";
      data.hook_id = projects[projectId].hook_id;
      expectedStatus = 204;
    }

    client
      .toggleGitlabProject(method, data)
      .then((res) => {
        if (res.status === expectedStatus) {
          setProjects((currentProjects) => ({
            ...currentProjects,
            [projectId]: {
              ...currentProjects[projectId],
              hook_id: checked ? res.data.id : null,
            },
          }));
          if (checked) {
            fetchWebhookTokenStatus();
          }
        }
      })
      .catch((e) => {
        // A 409 means the delegated GitLab authorization expired between page
        // load and this toggle. Refresh the status so the renewal banner and
        // its action are shown, instead of silently reverting the toggle.
        if (e?.response?.status === 409) {
          fetchWebhookTokenStatus();
          return;
        }
        dispatch(errorActionCreator(e));
      })
      .finally(() => {
        setToggling(projectId, false);
      });
  };

  const onSearchFilterChange = (value) => {
    // reset pagination if search filter changes
    setPagination(DEFAULT_PAGINATION);
    setSearchFilter(value);
  };

  const renewWebhookToken = () => {
    setRenewingWebhookToken(true);
    setWebhookTokenRenewalError(null);
    client
      .renewGitlabWebhookToken()
      .then(({ data }) => {
        // Keeps the global WebhookExpiryWarning banner (and any other
        // consumer) in sync with this renewal immediately, instead of it
        // only finding out on its own next independent fetch.
        dispatch({ type: GITLAB_WEBHOOK_TOKEN_UPDATED, status: data });
      })
      .catch(() =>
        setWebhookTokenRenewalError(
          "The GitLab webhook authorization could not be renewed.",
        ),
      )
      .finally(() => setRenewingWebhookToken(false));
  };

  if (fetchingProjects && projects === null) {
    // projects were never fetched before, show spinner
    return (
      <Loader active inline="centered">
        Fetching projects...
      </Loader>
    );
  }

  if (!projects) {
    return (
      <Message info icon>
        <Icon name="info circle" />
        <Message.Content>
          <Message.Header>Connect to GitLab</Message.Header>
          <div className={styles["gitlab-msg-body"]}>
            <span>
              In order to integrate your GitLab projects with REANA you need to
              grant permissions.
            </span>
            <Button
              href={GITLAB_AUTH_URL}
              className={styles["gitlab-btn"]}
              primary
            >
              <Icon name="gitlab" />
              Connect
            </Button>
          </div>
        </Message.Content>
      </Message>
    );
  } else {
    return (
      <>
        {(webhookTokenPhase === "error" ||
          webhookTokenPhase === "retry_wait") && (
          <Message warning>
            <Message.Header>
              GitLab webhook authorization status is unavailable
            </Message.Header>
            <p>The GitLab webhook authorization status could not be loaded.</p>
            <Button
              type="button"
              loading={webhookTokenPhase === "loading"}
              disabled={webhookTokenPhase === "loading"}
              onClick={fetchWebhookTokenStatus}
            >
              Retry loading authorization status
            </Button>
          </Message>
        )}
        {webhookToken?.configured && (
          <Message warning={webhookTokenExpired} info={!webhookTokenExpired}>
            <Message.Header>
              GitLab webhook authorization
              {webhookTokenExpired ? " has expired" : " is time-limited"}
            </Message.Header>
            <p>
              {webhookTokenExpired
                ? "GitLab cannot start workflows until you renew this authorization."
                : "Existing GitLab webhooks are authorized until " +
                  new Date(webhookToken.expires_at).toLocaleString() +
                  "."}{" "}
              Renewal confirms your current REANA entitlement and keeps the
              secret already installed in your GitLab projects. If GitLab has
              disabled a webhook, send a test delivery or re-enable it from that
              project's GitLab webhook settings after renewing.
            </p>
            <Button
              type="button"
              loading={renewingWebhookToken}
              disabled={renewingWebhookToken}
              onClick={renewWebhookToken}
            >
              Renew webhook authorization
            </Button>
            {webhookTokenRenewalError && <p>{webhookTokenRenewalError}</p>}
          </Message>
        )}
        <Search search={onSearchFilterChange} loading={fetchingProjects} />
        {!isEmpty(projects) ? (
          <>
            <List>
              {Object.entries(projects).map(
                ([id, { name, hook_id: hookId, path, url, toggling }]) => {
                  return (
                    <List.Item key={id} className={styles["list-item"]}>
                      <List.Icon
                        name="gitlab"
                        size="large"
                        verticalAlign="middle"
                      />
                      <List.Content>
                        <List.Header
                          as="a"
                          href={url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {name}
                        </List.Header>
                        <List.Description
                          as="a"
                          href={url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {path}
                        </List.Description>
                      </List.Content>
                      <Radio
                        toggle
                        // While the delegated authorization is expired, block
                        // enabling new projects (which would install a webhook
                        // REANA rejects) but keep disabling existing ones.
                        disabled={
                          toggling || (webhookTokenExpired && hookId === null)
                        }
                        value={id}
                        checked={hookId !== null}
                        onChange={onToggleProject}
                      />
                    </List.Item>
                  );
                },
              )}
            </List>
            <div className={styles.pagination}>
              <Pagination
                activePage={pagination.page}
                totalPages={totalPages}
                onPageChange={(_, { activePage }) => {
                  setPagination({ ...pagination, page: activePage });
                }}
                disabled={fetchingProjects}
              />
            </div>
          </>
        ) : (
          <Message info icon>
            <Icon name="info circle" />
            <Message.Content>
              <Message.Header>No GitLab projects found</Message.Header>
              <p>
                If you would like to use REANA with GitLab, please adjust your
                search query or{" "}
                <a
                  href="https://gitlab.cern.ch/projects/new"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  create a new project
                </a>{" "}
                and come back.
              </p>
            </Message.Content>
          </Message>
        )}
      </>
    );
  }
}
