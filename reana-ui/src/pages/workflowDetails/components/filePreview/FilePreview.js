/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2023, 2025, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import sortBy from "lodash/sortBy";
import PropTypes from "prop-types";
import { Component, Suspense, lazy, useEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Icon, Loader, Message, Modal } from "semantic-ui-react";

import client, { WORKFLOW_FILE_URL } from "~/client";
import { getConfig } from "~/selectors";
import { formatFileSize, getMimeType, parseFiles } from "~/util";
import { CopyButton } from "~/components";

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

/**
 * Catch errors thrown while rendering a file preview, so that a broken preview
 * shows a message inside the modal instead of unmounting the whole page.
 */
class PreviewErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("File preview failed", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Modal.Content>
          <Message
            icon="exclamation triangle"
            content="An error occurred while displaying the file preview. Please use the download button."
            warning
          />
        </Modal.Content>
      );
    }
    return this.props.children;
  }
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

export default function FilePreview({ workflow, fileName, onClose }) {
  const config = useSelector(getConfig);
  const location = useLocation();
  const isSharedLink = !location.state?.internal;
  const [size, setSize] = useState(null);
  const [error, setError] = useState(null);
  const shareUrl = `${window.location.origin}/workflows/${workflow}/workspace?name=${encodeURIComponent(fileName)}`;
  const navigationType = useNavigationType();

  useEffect(() => {
    const stateSize = location.state?.size;
    if (stateSize !== undefined && navigationType === "PUSH") {
      setSize(stateSize);
      return;
    }
    setSize(null);
    setError(null);
    client
      .getWorkflowFiles(
        workflow,
        { page: 1, size: 1, file_name: fileName },
        JSON.stringify({ name: [fileName] }),
      )
      .then((resp) => {
        const items = parseFiles(resp.data.items ?? []);
        const match = items.find((f) => f.name === fileName);
        if (match === undefined) {
          throw new Error("File not found");
        }
        setSize(match?.size?.raw ?? 0);
      })
      .catch((err) => {
        setError(err);
        setSize(0);
      });
  }, [workflow, fileName, location.state, navigationType]);

  let preview = null;

  if (error && isSharedLink) {
    preview = (
      <Modal.Content>
        <Message
          icon="exclamation triangle"
          content="This file cannot be previewed. It may have been removed from this workspace or you may not have access to it anymore."
          warning
        />
      </Modal.Content>
    );
  } else if (error && !isSharedLink) {
    preview = (
      <Modal.Content>
        <Message
          icon="exclamation triangle"
          content="An error occurred while loading the file preview. Please try again later or use the download button."
          warning
        />
      </Modal.Content>
    );
  } else if (size === null) {
    preview = (
      <Modal.Content>
        <Loader
          active
          className={styles["dark-loader"]}
          inline="centered"
          content="Loading file preview..."
        />
      </Modal.Content>
    );
  } else {
    const message = checkConstraints(
      fileName,
      size,
      config.filePreviewSizeLimit,
    );
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
  }

  return (
    <Modal open closeIcon onClose={onClose ? onClose : () => {}}>
      <Modal.Header>{fileName}</Modal.Header>
      {isSharedLink && !error && (
        <Modal.Content>
          <Modal.Description>
            <Message
              icon="info circle"
              content="Workspace files can change over time — you're viewing the current version of this file."
              info
            />
          </Modal.Description>
        </Modal.Content>
      )}
      {/* Remount the boundary when the file changes to clear a previous error */}
      <PreviewErrorBoundary key={`${workflow}/${fileName}`}>
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
      </PreviewErrorBoundary>
      {!error && (
        <Modal.Actions>
          <CopyButton text={shareUrl} label="Copy link" icon="linkify" />
          <Button primary as="a" href={getFileURL(workflow, fileName, false)}>
            <Icon name="download" /> Download
          </Button>
        </Modal.Actions>
      )}
    </Modal>
  );
}

FilePreview.propTypes = {
  workflow: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};
