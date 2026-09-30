/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

// Tests of the sandboxed ROOT file viewer in `public/root-viewer/app/`, run
// in an iframe of the test page with a stub jsroot.

import fs from "fs";
import path from "path";
import { waitFor } from "@testing-library/react";

const VIEWER_SCRIPT = fs.readFileSync(
  path.resolve(__dirname, "../../../../../public/root-viewer/app/viewer.js"),
  "utf8",
);

const fileContent = new ArrayBuffer(8);

let viewer, openRootFile, postToUI;

beforeEach(() => {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  viewer = iframe.contentWindow;
  viewer.document.body.innerHTML = '<div id="root-browser"></div>';
  openRootFile = jest.fn().mockResolvedValue({});
  viewer.JSROOT = {
    buildGUI: jest.fn().mockResolvedValue({ openRootFile }),
  };
  postToUI = jest.spyOn(window, "postMessage").mockImplementation(() => {});
  viewer.eval(VIEWER_SCRIPT);
});

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = "";
});

function sendToViewer(data, { source = window, origin } = {}) {
  viewer.dispatchEvent(
    new viewer.MessageEvent("message", {
      data,
      source,
      origin: origin ?? viewer.location.origin,
    }),
  );
}

function openFile(options) {
  sendToViewer(
    { type: "reana-root-viewer:open", buffer: fileContent },
    options,
  );
}

function viewerText() {
  return viewer.document.getElementById("root-browser").textContent;
}

test("announces to the UI that it is ready", () => {
  viewer.dispatchEvent(new viewer.Event("load"));

  expect(postToUI).toHaveBeenCalledWith(
    { type: "reana-root-viewer:ready" },
    viewer.location.origin,
  );
});

test("opens the file sent by the UI", async () => {
  openFile();

  await waitFor(() => expect(openRootFile).toHaveBeenCalledWith(fileContent));
  expect(viewer.JSROOT.buildGUI).toHaveBeenCalledWith("root-browser");
  expect(viewerText()).not.toMatch(/Cannot display/);
});

test.each([
  ["another window", { source: null }],
  ["another origin", { origin: "https://example.org" }],
])("ignores files sent from %s", async (_, options) => {
  openFile(options);

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(viewer.JSROOT.buildGUI).not.toHaveBeenCalled();
});

test.each([
  ["jsroot cannot read the file", () => openRootFile.mockResolvedValue(false)],
  ["jsroot fails", () => openRootFile.mockRejectedValue(new Error("broken"))],
  ["jsroot is not loaded", () => delete viewer.JSROOT],
])("shows an error when %s", async (_, setUp) => {
  setUp();
  openFile();

  await waitFor(() =>
    expect(viewerText()).toMatch(/^Cannot display the ROOT file: /),
  );
});

test("replaces cookies and web storage, which an opaque origin cannot use", () => {
  viewer.document.cookie = "setting=1";
  expect(viewer.document.cookie).toBe("");

  for (const storage of [viewer.localStorage, viewer.sessionStorage]) {
    storage.setItem("setting", 1);
    expect(storage.getItem("setting")).toBe("1");
    expect(storage.length).toBe(1);
    expect(storage.key(0)).toBe("setting");
    storage.removeItem("setting");
    expect(storage.getItem("setting")).toBeNull();
  }
});
