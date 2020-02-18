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
import {
  Button,
  Icon,
  Modal,
  Segment,
  Table,
  Loader,
  Message
} from "semantic-ui-react";

import config from "../../../config";
import { getWorkflowFiles, loadingDetails } from "../../../selectors";
import { fetchWorkflowFiles } from "../../../actions";

import styles from "./WorkflowFiles.module.scss";

const PREVIEW_WHITELIST = [".png", ".jpg", ".jpeg", ".tiff", ".gif"];
const PREVIEW_BLACKLIST = [".root", ".pdf"];
const SIZE_LIMIT = 5 * 1024 ** 2; // 5MB

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

  const getFileURL = (fileName, preview = true) =>
    config.api +
    "/api/workflows/" +
    id +
    "/workspace/" +
    fileName +
    (preview ? "?preview" : "");

  /**
   * Check if the given file name matches any given extension
   * @param {Array} list Array of extensions to check against
   * @param {String} fileName File name to check
   * @return {Boolean} Whether the file name matches one of the extensions
   */
  function matchesExtensions(list, fileName) {
    return list.map(ext => fileName.endsWith(ext)).some(item => item);
  }

  /**
   * Verify if file overpasses size limit or has a blacklisted extension.
   * @param {*} fileName File name
   * @param {*} size File size
   * @return {component.Message|null} Component displaying reason or null
   */
  function checkConstraints(fileName, size) {
    let content;
    if (matchesExtensions(PREVIEW_BLACKLIST, fileName)) {
      content = "ROOT files cannot be previewed. Please use download.";
    } else if (size > SIZE_LIMIT) {
      content = `File size is too big to be previewed (limit ${SIZE_LIMIT /
        1024 ** 2}MB). Please use download.`;
    }
    return content ? (
      <Message icon="info circle" content={content} info />
    ) : null;
  }

  /**
   * Gets the file from the API
   */
  function getFile(fileName, size) {
    const message = checkConstraints(fileName, size);
    if (message) {
      setModalContent(message);
      return;
    }
    const url = getFileURL(fileName);
    const previewable = matchesExtensions(PREVIEW_WHITELIST, fileName);
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
        setModalContent(<pre>{result}</pre>);
      });
    }
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

        <Table.Body>
          {files &&
            files.map(({ name, lastModified, size }) => (
              <Modal
                key={name}
                onOpen={() => getFile(name, size)}
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
                <Modal.Header>{name}</Modal.Header>
                <Modal.Content scrolling>
                  {isPreviewable ? (
                    <img src={modalContent} alt={name} />
                  ) : (
                    modalContent
                  )}
                </Modal.Content>
                <Modal.Actions>
                  <Button primary as="a" href={getFileURL(name, false)}>
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
