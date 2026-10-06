/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { act, render, screen, waitFor } from "@testing-library/react";

import client from "~/client";
import ROOTPreview from "./ROOTPreview";

const fileContent = new ArrayBuffer(8);

beforeEach(() => {
  jest
    .spyOn(client, "getWorkflowFile")
    .mockResolvedValue({ data: fileContent });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderPreview() {
  render(<ROOTPreview workflow="workflow-id" fileName="results/data.root" />);
  const viewer = screen.getByTitle("ROOT file viewer for results/data.root");
  const postMessage = jest
    .spyOn(viewer.contentWindow, "postMessage")
    .mockImplementation(() => {});
  return { viewer, postMessage };
}

function sendMessage(data, { origin = "null", source } = {}) {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin, source }));
  });
}

test("runs the viewer in a sandbox without REANA's origin", async () => {
  const { viewer } = renderPreview();
  await waitFor(() => expect(client.getWorkflowFile).toHaveBeenCalled());

  const sandbox = viewer.getAttribute("sandbox").split(" ");
  expect(sandbox).toContain("allow-scripts");
  expect(sandbox).not.toContain("allow-same-origin");
});

test("sends the file once the viewer is ready", async () => {
  const { viewer, postMessage } = renderPreview();
  await waitFor(() =>
    expect(client.getWorkflowFile).toHaveBeenCalledWith(
      "workflow-id",
      "results/data.root",
      { responseType: "arraybuffer" },
    ),
  );
  expect(postMessage).not.toHaveBeenCalled();

  sendMessage(
    { type: "reana-root-viewer:ready" },
    { source: viewer.contentWindow },
  );

  await waitFor(() =>
    expect(postMessage).toHaveBeenCalledWith(
      { type: "reana-root-viewer:open", buffer: fileContent },
      "*",
    ),
  );
});

test.each([
  ["another window", { source: window }],
  ["a non-sandboxed origin", { origin: "https://example.org" }],
])("ignores ready messages from %s", async (_, messageOptions) => {
  const { viewer, postMessage } = renderPreview();
  await waitFor(() => expect(client.getWorkflowFile).toHaveBeenCalled());

  sendMessage(
    { type: "reana-root-viewer:ready" },
    { source: viewer.contentWindow, ...messageOptions },
  );

  expect(postMessage).not.toHaveBeenCalled();
});
