/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2023, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useRef, useState } from "react";
import { Modal } from "semantic-ui-react";

import client from "~/client";

import styles from "./FilePreview.module.scss";

// jsroot evaluates formulas stored in ROOT files as JavaScript, so it runs in
// a sandboxed viewer with an opaque origin instead of in REANA's origin.
const ROOT_VIEWER_URL = `${process.env.PUBLIC_URL}/root-viewer/app/index.html`;

/**
 * Preview of ROOT files.
 */
export default function ROOTPreview({ workflow, fileName }) {
  const viewerRef = useRef(null);
  const [filebuffer, setFilebuffer] = useState(null);
  const [viewerReady, setViewerReady] = useState(false);

  // Download the file and save it as an ArrayBuffer
  useEffect(() => {
    client
      .getWorkflowFile(workflow, fileName, { responseType: "arraybuffer" })
      .then((res) => setFilebuffer(res.data));
  }, [workflow, fileName]);

  // Wait for the viewer to announce that it can receive the file
  useEffect(() => {
    function handleMessage(event) {
      if (
        event.source !== viewerRef.current?.contentWindow ||
        event.origin !== "null"
      ) {
        return;
      }
      if (event.data?.type === "reana-root-viewer:ready") {
        setViewerReady(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Send the file to the viewer. Its origin is opaque, so it can only be
  // addressed with the "*" target origin.
  useEffect(() => {
    if (!viewerReady || filebuffer === null) {
      return;
    }
    viewerRef.current.contentWindow.postMessage(
      { type: "reana-root-viewer:open", buffer: filebuffer },
      "*",
    );
  }, [viewerReady, filebuffer]);

  return (
    <Modal.Content className={styles["fill-modal"]}>
      <iframe
        className={styles["root-viewer"]}
        ref={viewerRef}
        src={ROOT_VIEWER_URL}
        sandbox="allow-scripts allow-downloads"
        title={`ROOT file viewer for ${fileName}`}
      />
    </Modal.Content>
  );
}
