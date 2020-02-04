/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import _ from "lodash";
import { Dimmer, Icon, Menu, Segment, Table, Loader } from "semantic-ui-react";

import WorkflowsProgress from "./WorkflowsProgress";
import WorkflowsActions from "./WorkflowsActions";
import NoWorkflows from "./NoWorkflows";
import config from "../../../config";

export default function WorkflowsList() {
  const [column, setColumn] = useState(null);
  const [workflows, setWorkflows] = useState(null);
  const [direction, setDirection] = useState(null);
  const [loading, setLoading] = useState(false);
  const interval = useRef(null);

  useEffect(() => {
    /**
     * Gets data from the specified API
     */
    function getWorkflows() {
      setLoading(true);
      axios({
        method: "get",
        url: config.api + "/api/workflows",
        withCredentials: true
      }).then(res => {
        setWorkflows(parseData(res.data));
        setLoading(false);
      });
    }

    /**
     * Parses API data into displayable data
     */
    function parseData(wfs) {
      if (!Array.isArray(wfs)) return [];

      wfs.forEach(wf => {
        let info = wf["name"].split(".");
        wf["name"] = info[0];
        wf["run"] = info[1];

        let date = new Date(wf["created"]);
        wf["created"] = wf["created"].replace("T", " ");
        wf["duration"] = msToTime(Date.now() - date.getTime());
      });

      return wfs;
    }

    getWorkflows();
  }, []);

  useEffect(() => {
    function updateProgresses() {
      workflows.forEach(wf => {
        axios({
          method: "get",
          url: config.api + "/api/workflows/" + wf["id"] + "/status",
          withCredentials: true
        }).then(res => {
          const progress = res.data.progress.finished;
          const total = res.data.progress.total;
          wf["completed"] = typeof progress === "object" ? progress.total : 0;
          wf["total"] = total.total;

          const date = new Date(res.data.created);
          wf["duration"] = msToTime(Date.now() - date.getTime());
        });
      });
      setWorkflows([...workflows]);
    }

    if (!interval.current && workflows && workflows.length) {
      interval.current = setInterval(() => {
        updateProgresses();
      }, config.pooling_secs * 1000);
    }
  }, [workflows]);

  /**
   * Transforms millisecond into a 'HH MM SS' string format
   */
  function msToTime(millis) {
    let seconds = Math.floor((millis / 1000) % 60);
    let minutes = Math.floor((millis / (1000 * 60)) % 60);
    let hours = Math.floor((millis / (1000 * 60 * 60)) % 24);
    let days = Math.floor(millis / (1000 * 60 * 60 * 24));

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
  }

  /**
   * Performs the sorting when a column header is clicked
   */
  const handleSort = clickedColumn => () => {
    if (column !== clickedColumn) {
      setColumn(clickedColumn);
      setWorkflows(_.sortBy(workflows, [clickedColumn]));
      setDirection("ascending");
      return;
    }
    setWorkflows(workflows.reverse());
    setDirection(direction === "ascending" ? "descending" : "ascending");
  };

  if (loading) {
    return (
      <Dimmer active>
        <Loader>Loading workflows</Loader>
      </Dimmer>
    );
  } else if (workflows && !workflows.length) {
    return <NoWorkflows />;
  } else {
    return (
      <Segment basic padded>
        <Table sortable fixed>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "name" ? direction : null}
                onClick={handleSort("name")}
              >
                Name
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="1"
                sorted={column === "run" ? direction : null}
                onClick={handleSort("run")}
              >
                Run
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "created" ? direction : null}
                onClick={handleSort("created")}
              >
                Created
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="2"
                sorted={column === "duration" ? direction : null}
                onClick={handleSort("duration")}
              >
                Duration
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="8"
                sorted={column === "progress" ? direction : null}
                onClick={handleSort("progress")}
              >
                Progress
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="1"
                sorted={column === "status" ? direction : null}
                onClick={handleSort("status")}
              >
                Status
              </Table.HeaderCell>
              <Table.HeaderCell colSpan="4">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {_.map(
              workflows,
              ({
                id,
                name,
                run,
                created,
                duration,
                completed,
                total,
                status
              }) => (
                <Table.Row key={id}>
                  <Table.Cell colSpan="2">{name}</Table.Cell>
                  <Table.Cell colSpan="1">{run}</Table.Cell>
                  <Table.Cell colSpan="2">{created}</Table.Cell>
                  <Table.Cell colSpan="2">{duration}</Table.Cell>
                  <Table.Cell colSpan="8">
                    <WorkflowsProgress
                      completed={completed}
                      total={total}
                      status={status}
                    />
                  </Table.Cell>
                  <Table.Cell colSpan="1">{status}</Table.Cell>
                  <Table.Cell colSpan="4">
                    <WorkflowsActions
                      id={id}
                      name={name}
                      run={run}
                      created={created}
                      status={status}
                    />
                  </Table.Cell>
                </Table.Row>
              )
            )}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan="20">
                <Menu floated="right" pagination>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron left" />
                  </Menu.Item>
                  <Menu.Item as="a">1</Menu.Item>
                  <Menu.Item as="a">2</Menu.Item>
                  <Menu.Item as="a">3</Menu.Item>
                  <Menu.Item as="a">4</Menu.Item>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron right" />
                  </Menu.Item>
                </Menu>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Segment>
    );
  }
}
