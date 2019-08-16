/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2019 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import Header from "../../components/Header";
import axios from "axios";
import history from "../../history";
import Config from "../../config";
import { Button, List, Radio, Segment } from "semantic-ui-react";

export default class GitLabProjects extends Component {
  state = {
    selected_project: "",
    projects: []
  };

  /**
   * Default runnable method when the component is loaded
   */
  componentDidMount() {
    this.getProjects();
  }

  /**
   * Gets data from the specified API
   */
  getProjects() {
    axios({
      method: "get",
      url: Config.api + "/api/gitlab/projects",
      withCredentials: true
    })
      .then(res => {
        this.setState({ projects: res.data });
      })
      .catch(e => {
        this.setState({ projects: [] });
      });
  }

  handleProjectClick = project => {
    this.setState({ selected_project: project.target.id });
  };

  handleClick = () => {
    axios({
      method: "post",
      url: Config.api + "/api/gitlab/webhook",
      data: {
        project_id: this.state.selected_project
      },
      withCredentials: true
    })
      .then(res => {
        history.replace("/workflows");
      })
      .catch(e => {
        this.setState({ selected_project: "" });
      });
  };

  render() {
    return (
      <div>
        <Header />
        <Segment basic padded>
          <List selection>
            {this.state.projects.map(project => {
              return (
                <Radio
                  key={project.id}
                  id={project.id}
                  onClick={this.handleProjectClick}
                  label={project.name}
                ></Radio>
              );
            })}
          </List>
          <Button
            primary
            floated="right"
            disabled={!this.state.selected_project}
            onClick={this.handleClick}
          >
            Connect project
          </Button>
        </Segment>
      </div>
    );
  }
}
