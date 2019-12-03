/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Dimmer,
  List,
  Loader,
  Radio,
  Segment,
  Message,
  Icon
} from "semantic-ui-react";
import TopHeader from "../../components/TopHeader";
import axios from "axios";
import history from "../../history";
import config from "../../config";

import "./GitLabProjects.css";

const GITLAB_AUTH_URL = config.api + "/api/gitlab/connect";

export default function GitLabProjects() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(null);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  useEffect(() => {
    /**
     * Gets data from the specified API
     */
    const getProjects = () => {
      setFetchingProjects(true);
      axios({
        method: "get",
        url: config.api + "/api/gitlab/projects",
        withCredentials: true
      })
        .then(res => {
          setProjects(res.data);
          setFetchingProjects(false);
        })
        .catch(e => {
          setProjects(null);
          setFetchingProjects(false);
        });
    };

    getProjects();
  }, []);

  const handleProjectClick = project => {
    setSelectedProject(project.target.id);
  };

  const handleClick = () => {
    axios({
      method: "post",
      url: config.api + "/api/gitlab/webhook",
      data: {
        project_id: selectedProject
      },
      withCredentials: true
    })
      .then(res => {
        history.replace("/workflows");
      })
      .catch(e => {
        setSelectedProject(null);
      });
  };

  if (fetchingProjects) {
    return (
      <Dimmer active>
        <Loader>Fetching projects...</Loader>
      </Dimmer>
    );
  }

  if (!projects) {
    return (
      <div>
        <TopHeader />
        <Container text className="gitlab-container">
          <Message info icon>
            <Icon name="info circle" />
            <Message.Content>
              <Message.Header>Connect to GitLab</Message.Header>
              <div className="gitlab-msg-body">
                <span>
                  In order to integrate your GitLab projects with REANA you need
                  to grant permissions.
                </span>
                <Button href={GITLAB_AUTH_URL} primary className="gitlab-btn">
                  <Icon name="gitlab" />
                  Connect
                </Button>
              </div>
            </Message.Content>
          </Message>
        </Container>
      </div>
    );
  } else {
    return (
      <div>
        <TopHeader />
        {projects.length ? (
          <Segment basic padded>
            <List selection>
              {projects.map(project => {
                return (
                  <Radio
                    key={project.id}
                    id={project.id}
                    onClick={handleProjectClick}
                    label={project.name}
                  ></Radio>
                );
              })}
            </List>
            <Button
              primary
              floated="right"
              disabled={!selectedProject}
              onClick={handleClick}
            >
              Connect project
            </Button>
          </Segment>
        ) : (
          <Container text className="no-projects-container">
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
          </Container>
        )}
      </div>
    );
  }
}
