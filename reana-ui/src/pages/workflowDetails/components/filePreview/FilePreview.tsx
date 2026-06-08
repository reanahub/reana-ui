/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import sortBy from "lodash/sortBy";
import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Icon, Loader, Message, Modal } from "semantic-ui-react";

import client, { WORKFLOW_FILE_URL } from "~/client";
import { useGetConfig } from "~/api/hooks";
import { formatFileSize, getMimeType, parseFiles } from "~/util";
import { CopyLinkButton } from "..";

import styles from "./FilePreview.module.scss";

// ROOTPreview is lazily loaded to enable code splitting, so that jsroot is not part of
// the main application bundle
const ROOTPreview = lazy(() => import("./ROOTPreview.js"));

interface FilePreviewSubProps {
  workflow: string;
  fileName: string;
  size?: number;
  url?: string;
}

interface FilePreviewProps {
  workflow: string;
  fileName: string;
  onClose?: () => void;
}

/**
 * Preview of image files.
 */
function ImagePreview({
  fileName,
  url,
}: Pick<FilePreviewSubProps, "fileName" | "url">) {
  return (
    <Modal.Content scrolling>
      <img src={url} alt={fileName} />
    </Modal.Content>
  );
}

/**
 * Preview of HTML files.
 */
function HTMLPreview({ url }: Pick<FilePreviewSubProps, "url">) {
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
function TextPreview({
  workflow,
  fileName,
}: Pick<FilePreviewSubProps, "workflow" | "fileName">) {
  const [content, setContent] = useState<string | null>(null);

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
function PDFPreview({
  fileName,
  url,
}: Pick<FilePreviewSubProps, "fileName" | "url">) {
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

const PREVIEW_MIME_PREFIX_WHITELIST: Record<
  string,
  React.ComponentType<any>
> = {
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
function matchesMimeType(list: string[], fileName: string): string | null {
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
function checkConstraints(
  fileName: string,
  size: number,
  sizeLimit: number,
): React.ReactElement | null {
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
function getFileURL(
  workflow: string,
  fileName: string,
  preview: boolean = true,
): string {
  return WORKFLOW_FILE_URL(workflow, fileName, { preview });
}

export default function FilePreview({
  workflow,
  fileName,
  onClose,
}: FilePreviewProps) {
  const config = useGetConfig().data ?? ({} as any);
  const location = useLocation();
  const isSharedLink = !location.state?.internal;
  const [size, setSize] = useState<number | null>(null);
  const shareUrl = `${window.location.origin}/workflows/${workflow}/workspace?name=${encodeURIComponent(fileName)}`;

  useEffect(() => {
    const stateSize = location.state?.size;
    if (stateSize !== undefined) {
      setSize(stateSize);
      return;
    }
    setSize(null);
    client
      .getWorkflowFiles(
        workflow,
        { page: 1, size: 1 },
        JSON.stringify({ name: [fileName] }),
      )
      .then((resp) => {
        const items = parseFiles(resp.data.items ?? []);
        const match = items.find((f) => f.name === fileName);
        setSize(match?.size?.raw ?? 0);
      })
      .catch(() => setSize(0));
  }, [workflow, fileName]);

  let preview = null;

  if (size === null) {
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
      {isSharedLink && (
        <Modal.Description>
          <Message
            icon="info circle"
            content="Workspace files can change over time — you're viewing the current version of this file."
            info
          />
        </Modal.Description>
      )}
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
        <CopyLinkButton url={shareUrl} fileName={fileName} label="Copy link" />
        <Button primary as="a" href={getFileURL(workflow, fileName, false)}>
          <Icon name="download" /> Download
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
