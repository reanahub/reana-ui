/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import sortBy from "lodash/sortBy";
import PropTypes from "prop-types";
import { Suspense, lazy, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Icon, Loader, Message, Modal } from "semantic-ui-react";

import client, { WORKFLOW_FILE_URL } from "~/client";
import { getConfig } from "~/selectors";
import { formatFileSize, getMimeType } from "~/util";

import styles from "./FilePreview.module.scss";

// ROOTPreview is lazily loaded to enable code splitting, so that jsroot is not part of
// the main application bundle
const ROOTPreview = lazy(() => import("./ROOTPreview.js"));

/**
 * Preview of image files.
 */
function ImagePreview({ fileName, url }) {
  return (
    <Modal.Content scrolling>
      <img src={url} alt={fileName} />
    </Modal.Content>
  );
}

/**
 * Preview of HTML files.
 */
function HTMLPreview({ url }) {
  return (
    <Modal.Content scrolling>
      <Message
        icon="info circle"
        info
        content={
          <div className={styles["html-message"]}>
            <span>Visualise this HTML file in a different tab.</span>
            <Button
              icon="external"
              as="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              content="Open"
              primary
            />
          </div>
        }
      />
    </Modal.Content>
  );
}

/**
 * Preview of plain-text files.
 */
function TextPreview({ workflow, fileName }) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    client.getWorkflowFile(workflow, fileName).then((res) => {
      let result = res.data;
      if (typeof result === "object") {
        result = JSON.stringify(result);
      }
      setContent(result);
    });
  }, [workflow, fileName]);

  return (
    <Modal.Content scrolling>
      <pre>{content}</pre>
    </Modal.Content>
  );
}

/**
 * Preview of PDF files.
 */
function PDFPreview({ fileName, url }) {
  return (
    <Modal.Content className={styles["fill-modal"]}>
      <object data={url}>
        <Message icon info style={{ margin: "1.5rem", width: "auto" }}>
          <Icon name="info circle" />
          <Message.Content>
            Click{" "}
            <a href={url} target="_blank" rel="noopener noreferrer">
              {fileName}
            </a>{" "}
            to open the PDF file, or use the download button.
          </Message.Content>
        </Message>
      </object>
    </Modal.Content>
  );
}

const PREVIEW_MIME_PREFIX_WHITELIST = {
  "image/": ImagePreview,
  "text/html": HTMLPreview,
  "text/": TextPreview,
  "application/x-sh": TextPreview,
  "application/json": TextPreview,
  "application/pdf": PDFPreview,
  "application/x-root": ROOTPreview,
};

/**
 * Check if the given file name matches any given mime-type prefix
 * @param {Array} list Array of mime-type prefixes to check against
 * @param {String} fileName File name to check
 * @return {?String} Longest mime-type prefix that matches the file name if any, `null` otherwise
 */
function matchesMimeType(list, fileName) {
  const mimeType = getMimeType(fileName);
  if (!mimeType) {
    return null;
  }
  // Sort matching mime-types prefixes by length and return the longest
  const matches = sortBy(
    list.filter((mimePrefix) => mimeType.startsWith(mimePrefix)),
    [(mimePrefix) => mimePrefix.length],
  );
  return matches.pop() ?? null;
}

/**
 * Verify if file overpasses size limit or has a blacklisted mime-type.
 * @param {String} fileName File name
 * @param {Integer} size File size
 * @return {component.Message|null} Component displaying reason or null
 */
function checkConstraints(fileName, size, sizeLimit) {
  let content;
  const match = matchesMimeType(
    Object.keys(PREVIEW_MIME_PREFIX_WHITELIST),
    fileName,
  );
  if (!match) {
    const fileExt = fileName.split(".").pop();
    content = `${fileExt} files cannot be previewed. Please use download.`;
  } else if (size > sizeLimit) {
    content = `File size is too big to be previewed (limit ${formatFileSize(
      sizeLimit,
    )}). Please use download.`;
  }
  return content ? <Message icon="info circle" content={content} info /> : null;
}

/**
 * Build the URL of a file.
 */
function getFileURL(workflow, fileName, preview = true) {
  return WORKFLOW_FILE_URL(workflow, fileName, { preview });
}

export default function FilePreview({ workflow, fileName, size, onClose }) {
  const config = useSelector(getConfig);

  let preview = null;
  // Check whether the file can be previewed
  const message = checkConstraints(fileName, size, config.filePreviewSizeLimit);
  if (message) {
    preview = <Modal.Content scrolling>{message}</Modal.Content>;
  } else {
    const mimeType = matchesMimeType(
      Object.keys(PREVIEW_MIME_PREFIX_WHITELIST),
      fileName,
    );
    const Preview = PREVIEW_MIME_PREFIX_WHITELIST[mimeType];
    preview = (
      <Preview
        workflow={workflow}
        fileName={fileName}
        size={size}
        url={getFileURL(workflow, fileName)}
      />
    );
  }

  return (
    <Modal open closeIcon onClose={onClose ? onClose : () => {}}>
      <Modal.Header>{fileName}</Modal.Header>
      <Suspense
        fallback={
          <Modal.Content>
            <Loader
              active
              className={styles["dark-loader"]}
              inline="centered"
              content="Loading file preview..."
            />
          </Modal.Content>
        }
      >
        {preview}
      </Suspense>
      <Modal.Actions>
        <Button primary as="a" href={getFileURL(workflow, fileName, false)}>
          <Icon name="download" /> Download
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

FilePreview.propTypes = {
  workflow: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  onClose: PropTypes.func,
};
