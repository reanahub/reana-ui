/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import axios from "axios";
import _ from "lodash";
import { Button, Icon, Modal, Segment, Table, Loader } from "semantic-ui-react";

import config from "../../../config";
import { getWorkflowFiles, loadingDetails } from "../../../selectors";
import { fetchWorkflowFiles } from "../../../actions";

import styles from "./WorkflowFiles.module.scss";

export default function WorkflowFiles({ id, title }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const _files = useSelector(getWorkflowFiles(id));

  const [files, setFiles] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [column, setColumn] = useState(null);
  const [direction, setDirection] = useState(null);

  useEffect(() => {
    dispatch(fetchWorkflowFiles(id));
  }, [dispatch, id]);

  useEffect(() => {
    setFiles(_files);
  }, [_files]);

  /**
   * Gets the file from the API
   */
  function getFile(file_name) {
    // TODO: Move to actions
    axios({
      method: "get",
      url: config.api + "/api/workflows/" + id + "/workspace/" + file_name,
      withCredentials: true
    }).then(res => {
      setModalContent(res.data);
    });
  }

  /**
   * Downloads the file to the local machine
   */
  function downloadFile(file_name) {
    let element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(modalContent)
    );
    element.setAttribute("download", file_name);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Performs the sorting when a column header is clicked
   */
  function handleSort(clickedColumn) {
    if (column !== clickedColumn) {
      setDirection("ascending");
      setFiles(_.sortBy(files, [clickedColumn]));
      setColumn(clickedColumn);
      return;
    }
    setFiles(files.reverse());
    setDirection(direction === "ascending" ? "descending" : "ascending");
  }

  return loading ? (
    <Loader active inline="centered" />
  ) : (
    <Segment>
      <Table fixed compact basic="very">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={column === "name" ? direction : null}
              onClick={() => handleSort("name")}
              style={{ cursor: "pointer" }}
            >
              Name
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === "mod_date" ? direction : null}
              onClick={() => handleSort("mod_date")}
              style={{ cursor: "pointer" }}
            >
              Modified
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className={styles["files-list"]}>
          {_.map(files, ({ name, mod_date }) => (
            <Modal
              key={name}
              onOpen={() => getFile(name)}
              className={styles["modal-view"]}
              trigger={
                <Table.Row className={styles["files-row"]}>
                  <Table.Cell>
                    <Icon name="file" />
                    {name}
                  </Table.Cell>
                  <Table.Cell>{mod_date}</Table.Cell>
                </Table.Row>
              }
            >
              <Modal.Header className={styles["modal-header"]}>
                {name}
              </Modal.Header>
              <Modal.Content scrolling>
                <pre>{modalContent}</pre>
              </Modal.Content>
              <Modal.Actions className={styles["modal-actions"]}>
                <Button color="blue" onClick={() => downloadFile(name)}>
                  <Icon name="download" /> Download
                </Button>
              </Modal.Actions>
            </Modal>
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
}

WorkflowFiles.propTypes = {
  title: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
};
