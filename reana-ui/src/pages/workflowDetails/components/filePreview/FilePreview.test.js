/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";

import { CONFIG_RECEIVED } from "~/actions";
import client from "~/client";
import reducer from "~/reducers";
import FilePreview from "./FilePreview";

jest.mock("~/client", () => ({
  __esModule: true,
  default: {
    getWorkflowFiles: jest.fn(),
    getWorkflowFile: jest.fn(),
  },
  WORKFLOW_FILE_URL: (id, filename) =>
    `/api/workflows/${id}/workspace/${filename}`,
}));

// Stand-in for the jsroot-based preview that fails while rendering.
jest.mock("./ROOTPreview.js", () => ({
  __esModule: true,
  default: () => {
    throw new Error("boom");
  },
}));

const routerFutureFlags = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
};

const PREVIEW_ERROR =
  "An error occurred while displaying the file preview. Please use the download button.";

// CRA forces `resetMocks: true`, so implementations are set per test.
beforeEach(() => {
  client.getWorkflowFiles.mockImplementation((id, { file_name }) =>
    Promise.resolve({
      data: {
        items: [
          {
            name: file_name,
            size: { raw: 10, human_readable: "10 Bytes" },
            "last-modified": "2026-10-06T11:15:31",
          },
        ],
      },
    }),
  );
  client.getWorkflowFile.mockResolvedValue({ data: "Hello REANA" });
  // React and the error boundary log the caught error
  jest.spyOn(console, "error").mockImplementation(() => {});
});

function setup(fileName) {
  const store = createStore(reducer, applyMiddleware(thunk));
  store.dispatch({ type: CONFIG_RECEIVED, file_preview_size_limit: 1024 });

  const ui = (name) => (
    <Provider store={store}>
      <MemoryRouter future={routerFutureFlags}>
        <FilePreview workflow="wf1" fileName={name} />
      </MemoryRouter>
    </Provider>
  );
  const view = render(ui(fileName));
  return { rerender: (name) => view.rerender(ui(name)) };
}

describe("FilePreview", () => {
  test("shows a warning in the modal when the preview fails to render", async () => {
    setup("data.root");

    expect(await screen.findByText(PREVIEW_ERROR)).toBeInTheDocument();
    expect(screen.getByText("data.root")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toHaveAttribute(
      "href",
      "/api/workflows/wf1/workspace/data.root",
    );
  });

  test("clears the error when another file is previewed", async () => {
    const { rerender } = setup("data.root");
    expect(await screen.findByText(PREVIEW_ERROR)).toBeInTheDocument();

    rerender("results/greetings.txt");

    expect(await screen.findByText("Hello REANA")).toBeInTheDocument();
    expect(screen.queryByText(PREVIEW_ERROR)).not.toBeInTheDocument();
  });
});
