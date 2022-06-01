/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2021, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import sortBy from "lodash/sortBy";
import {
  Button,
  Icon,
  Modal,
  Segment,
  Table,
  Loader,
  Message,
} from "semantic-ui-react";

import {
  getWorkflowFiles,
  getWorkflowFilesCount,
  loadingDetails,
} from "~/selectors";
import { fetchWorkflowFiles } from "~/actions";
import client, { WORKFLOW_FILE_URL } from "~/client";
import { getMimeType } from "~/util";
import { Pagination, Search } from "~/components";
import { applyFilter } from "~/components/Search";

import styles from "./WorkflowFiles.module.scss";

const FILE_SIZE_LIMIT = 5 * 1024 ** 2; // 5MB
const PAGE_SIZE = 15;

const PREVIEW_MIME_PREFIX_WHITELIST = {
  "image/": {
    serverPreviewable: true,
    display: (content, alt) => <img src={content} alt={alt} />,
  },
  "text/html": {
    serverPreviewable: true,
    display: (content) => {
      return (
        <Message
          icon="info circle"
          info
          content={
            <div className={styles["html-message"]}>
              <span>Visualise this HTML file in a different tab.</span>
              <Button
                icon="external"
                as="a"
                href={content}
                target="_blank"
                rel="noopener noreferrer"
                content="Open"
                primary
              />
            </div>
          }
        />
      );
    },
  },
  "text/": {
    serverPreviewable: false,
    display: (content) => content,
  },
  "application/json": {
    serverPreviewable: false,
    display: (content) => content,
  },
};

export default function WorkflowFiles({ id }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const _files = useSelector(getWorkflowFiles(id));
  const filesCount = useSelector(getWorkflowFilesCount(id));

  const [files, setFiles] = useState();
  const [modalContent, setModalContent] = useState(null);
  const [sorting, setSorting] = useState({ column: null, direction: null });
  const [displayContent, setDisplayContent] = useState(() => () => null);
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE });
  const [searchFilter, setSearchFilter] = useState();

  useEffect(() => {
    dispatch(fetchWorkflowFiles(id, pagination, searchFilter));
  }, [dispatch, id, pagination, searchFilter]);

  useEffect(() => {
    setFiles(_files);
  }, [_files]);

  const getFileURL = (fileName, preview = true) =>
    WORKFLOW_FILE_URL(id, fileName, { preview });

  /**
   * Check if the given file name matches any given mime-type
   * @param {Array} list Array of mime-types to check against
   * @param {String} fileName File name to check
   * @return {Boolean} Extension that matches the file name
   */
  function matchesMimeType(list, fileName) {
    const mimeType = getMimeType(fileName);
    return mimeType && list.find((ext) => mimeType.startsWith(ext));
  }

  /**
   * Verify if file overpasses size limit or has a blacklisted mime-type.
   * @param {String} fileName File name
   * @param {Integer} size File size
   * @return {component.Message|null} Component displaying reason or null
   */
  function checkConstraints(fileName, size) {
    let content;
    const match = matchesMimeType(
      Object.keys(PREVIEW_MIME_PREFIX_WHITELIST),
      fileName
    );
    if (!match) {
      const fileExt = fileName.split(".").pop();
      content = `${fileExt} files cannot be previewed. Please use download.`;
    } else if (size > FILE_SIZE_LIMIT) {
      content = `File size is too big to be previewed (limit ${
        FILE_SIZE_LIMIT / 1024 ** 2
      }MB). Please use download.`;
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
      setDisplayContent(() => (content) => content);
      return;
    }
    const mimeType = matchesMimeType(
      Object.keys(PREVIEW_MIME_PREFIX_WHITELIST),
      fileName
    );
    const { serverPreviewable, display } =
      PREVIEW_MIME_PREFIX_WHITELIST[mimeType];
    setModalContent(getFileURL(fileName));
    setDisplayContent(() => display);
    if (!serverPreviewable) {
      client.getWorkflowFile(id, fileName).then((res) => {
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
    if (sorting.column !== clickedColumn) {
      setFiles(sortBy(files, [clickedColumn]));
      setSorting({ direction: "ascending", column: clickedColumn });
      return;
    }
    setFiles(files.reverse());
    setSorting({
      ...sorting,
      direction: sorting.direction === "ascending" ? "descending" : "ascending",
    });
  }

  function resetSort() {
    setSorting({ column: null, direction: null });
  }

  const headerIcon = (col) => (
    <Icon
      name={
        sorting.column === col
          ? sorting.direction === "ascending"
            ? "sort ascending"
            : "sort descending"
          : "sort"
      }
    />
  );

  return files === null ? (
    <Message
      icon="info circle"
      content="The workflow workspace was deleted."
      info
    />
  ) : (
    <>
      <Search
        search={applyFilter(setSearchFilter, pagination, setPagination)}
      />
      {loading ? (
        <Loader active inline="centered" className={styles["loader"]} />
      ) : (
        <Segment>
          <Table fixed compact basic="very">
            <Table.Header className={styles["table-header"]}>
              <Table.Row>
                <Table.HeaderCell
                  sorted={sorting.column === "name" ? sorting.direction : null}
                  onClick={() => handleSort("name")}
                >
                  Name {headerIcon("name")}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    sorting.column === "lastModified" ? sorting.direction : null
                  }
                  onClick={() => handleSort("lastModified")}
                >
                  Modified {headerIcon("lastModified")}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    sorting.column === "size.raw" ? sorting.direction : null
                  }
                  onClick={() => handleSort("size.raw")}
                >
                  Size {headerIcon("size.raw")}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {files &&
                files.map(({ name, lastModified, size }) => (
                  <Modal
                    key={name}
                    onOpen={() => getFile(name, size.raw)}
                    closeIcon
                    trigger={
                      <Table.Row className={styles["files-row"]}>
                        <Table.Cell>
                          <Icon name="file" />
                          {name}
                        </Table.Cell>
                        <Table.Cell>{lastModified}</Table.Cell>
                        <Table.Cell>
                          {size.human_readable || size.raw}
                        </Table.Cell>
                      </Table.Row>
                    }
                  >
                    <Modal.Header>{name}</Modal.Header>
                    <Modal.Content scrolling>
                      {displayContent &&
                        modalContent &&
                        displayContent(modalContent, name)}
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
          {filesCount > PAGE_SIZE && (
            <div className={styles["pagination-wrapper"]}>
              <Pagination
                activePage={pagination.page}
                totalPages={Math.ceil(filesCount / PAGE_SIZE)}
                onPageChange={(_, { activePage }) => {
                  setPagination({ ...pagination, page: activePage });
                  resetSort();
                }}
                size="mini"
              />
            </div>
          )}
        </Segment>
      )}
    </>
  );
}

WorkflowFiles.propTypes = {
  id: PropTypes.string.isRequired,
};
