/*
	-*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import isEmpty from "lodash/isEmpty";
import { useEffect, useState } from "react";
import { Button, List, Loader, Radio, Message, Icon } from "semantic-ui-react";

import client, { GITLAB_AUTH_URL } from "~/client";

import styles from "./GitLabProjects.module.scss";

export default function GitLabProjects() {
  const [projects, setProjects] = useState(null);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  useEffect(() => {
    /**
     * Gets data from the specified API
     */
    const getProjects = () => {
      setFetchingProjects(true);
      client
        .getGitlabProjects()
        .then((res) => {
          let newProjects = {};
          for (const [id, details] of Object.entries(res.data)) {
            newProjects[id] = { ...details, toggling: false };
          }
          setProjects(newProjects);
          setFetchingProjects(false);
        })
        .catch((e) => {
          setProjects(null);
          setFetchingProjects(false);
        });
    };

    getProjects();
  }, []);

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
        }
      })
      .catch((e) => {
        throw new Error(e);
      })
      .finally(() => {
        setToggling(projectId, false);
      });
  };

  if (fetchingProjects) {
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
                        <List.Header as="a">{name}</List.Header>
                        <List.Description as="a" href={url} target="_blank">
                          {path}
                        </List.Description>
                      </List.Content>
                      <Radio
                        toggle
                        disabled={toggling}
                        value={id}
                        checked={hookId !== null}
                        onChange={onToggleProject}
                      />
                    </List.Item>
                  );
                }
              )}
            </List>
          </>
        ) : (
          <Message info icon>
            <Icon name="info circle" />
            <Message.Content>
              <Message.Header>No GitLab projects found</Message.Header>
              <p>
                If you would like to use REANA with GitLab, please{" "}
                <a
                  href="https://gitlab.cern.ch/projects/new"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  create a project
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
