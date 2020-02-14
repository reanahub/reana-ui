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

const PREVIEW_WHITELIST = [".png", ".jpg", ".jpeg", ".tiff", ".gif"];
export default function WorkflowFiles({ id }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const _files = useSelector(getWorkflowFiles(id));

  const [files, setFiles] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [column, setColumn] = useState(null);
  const [direction, setDirection] = useState(null);
  const [isPreviewable, setIsPreviewable] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkflowFiles(id));
  }, [dispatch, id]);

  useEffect(() => {
    setFiles(_files);
  }, [_files]);

  const getFileURL = file_name =>
    config.api +
    "/api/workflows/" +
    id +
    "/workspace/" +
    file_name +
    "?preview";

  /**
   * Gets the file from the API
   */
  function getFile(file_name) {
    const url = getFileURL(file_name);
    debugger;
    const previewable = PREVIEW_WHITELIST.map(ext =>
      file_name.endsWith(ext)
    ).some(el => el);
    setModalContent(url);
    setIsPreviewable(previewable);
    if (!previewable) {
      axios({
        method: "get",
        url: url,
        withCredentials: true
      }).then(res => {
        let result = res.data;
        if (typeof result === "object") {
          result = JSON.stringify(result);
        }
        setModalContent(result);
      });
    }
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

  const headerIcon = col => (
    <Icon
      name={
        column === col
          ? direction === "ascending"
            ? "sort ascending"
            : "sort descending"
          : "sort"
      }
    />
  );

  return loading ? (
    <Loader active inline="centered" />
  ) : (
    <Segment>
      <Table fixed compact basic="very">
        <Table.Header className={styles["table-header"]}>
          <Table.Row>
            <Table.HeaderCell
              sorted={column === "name" ? direction : null}
              onClick={() => handleSort("name")}
            >
              Name {headerIcon("name")}
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === "lastModified" ? direction : null}
              onClick={() => handleSort("lastModified")}
            >
              Modified {headerIcon("lastModified")}
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === "size" ? direction : null}
              onClick={() => handleSort("size")}
            >
              Size {headerIcon("size")}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className={styles["files-list"]}>
          {files &&
            files.map(({ name, lastModified, size }) => (
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
                    <Table.Cell>{lastModified}</Table.Cell>
                    <Table.Cell>{size}</Table.Cell>
                  </Table.Row>
                }
              >
                <Modal.Header className={styles["modal-header"]}>
                  {name}
                </Modal.Header>
                <Modal.Content scrolling>
                  {isPreviewable ? (
                    <img src={modalContent} alt={name} />
                  ) : (
                    <pre>{modalContent}</pre>
                  )}
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
  id: PropTypes.string.isRequired
};
