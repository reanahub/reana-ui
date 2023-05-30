/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { buildGUI } from "jsroot";
import uniqueId from "lodash/uniqueId";
import { useEffect, useRef, useState } from "react";
import { Modal } from "semantic-ui-react";

import client from "~/client";

import styles from "./FilePreview.module.scss";

/**
 * Preview of ROOT files.
 */
export default function ROOTPreview({ workflow, fileName }) {
  // Ref used to check whether the div is ready to be modified by jsroot
  const divRef = useRef(null);
  const [id] = useState(uniqueId("RootBrowser-"));
  const [filebuffer, setFilebuffer] = useState(null);

  // Download the file and save it as an ArrayBuffer
  useEffect(() => {
    client
      .getWorkflowFile(workflow, fileName, { responseType: "arraybuffer" })
      .then((res) => setFilebuffer(res.data));
  }, [workflow, fileName]);

  // Open the ROOT file after the download, when the div is ready
  useEffect(() => {
    if (divRef.current === null || filebuffer === null) {
      return;
    }
    buildGUI(divRef.current.id).then((rootGUI) => {
      rootGUI.openRootFile(filebuffer);
    });
  });

  return (
    <Modal.Content
      className={`${styles["fill-modal"]} ${styles["root-modal"]}`}
    >
      <div
        className={styles["root-browser"]}
        id={id}
        noselect="true"
        ref={divRef}
      />
    </Modal.Content>
  );
}
