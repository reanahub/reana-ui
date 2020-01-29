/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Component } from "react";
import { Header, Segment } from "semantic-ui-react";
import Graph from "react-graph-vis";

export default class WorkflowSteps extends Component {
  /**
   * Variables defining the state of the table
   */
  constructor(props) {
    super(props);
    this.state = {
      graph: {
        nodes: [
          { id: 1, label: "Node 1" },
          { id: 2, label: "Node 2" },
          { id: 3, label: "Node 3" },
          { id: 4, label: "Node 4" },
          { id: 5, label: "Node 5" }
        ],
        edges: [
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 2, to: 5 }
        ]
      },
      options: {
        layout: {
          hierarchical: true
        },
        edges: {
          color: "#000000"
        }
      },
      events: {}
    };
  }

  render() {
    const { graph, options, events } = this.state;

    return (
      <Segment raised style={{ height: "100%" }}>
        <Header size="medium">Workflow</Header>
        <Graph graph={graph} options={options} events={events} />
      </Segment>
    );
  }
}
