/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import WorkflowLogs from "../WorkflowLogs";

const mockScrollToIndex = jest.fn();

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }) => ({
    getTotalSize: () => count * 28,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index + 1,
        size: 28,
        start: index * 28,
      })),
    scrollToIndex: mockScrollToIndex,
  }),
}));

let mockState = {};
const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

const WORKFLOW_ID = "wf-1";
const JOB_ID = "job-abc";
const COMPONENT_NAME = "dask-scheduler";

// Build 42 uniquely-labelled lines so assertions can prove which entry is rendered.
function makeLogs(prefix) {
  return (
    Array.from({ length: 42 }, (_, i) => `${prefix}: line ${i + 1}`).join(
      "\n",
    ) + "\n"
  );
}

function CurrentLocation() {
  const location = useLocation();
  return (
    <span data-testid="location">{`${location.pathname}${location.hash}`}</span>
  );
}

// Two jobs: "job-abc" is first, "job-other" is last (and therefore the default
// fallback when no valid URL param is present). If the component ignores the
// :job param and falls back to the default, "job-other" content appears instead
// of "job-abc" content, failing the text assertion below.
const JOB_STATE = {
  details: {
    loadingDetails: false,
    details: {
      [WORKFLOW_ID]: {
        logs: {
          engineLogs: "",
          serviceLogs: {},
          jobLogs: {
            "step-1": {
              backend_job_id: JOB_ID,
              job_name: "step-1",
              status: "finished",
              logs: makeLogs("job-abc"),
              compute_backend: "kubernetes",
              docker_img: "python:3.11",
              cmd: "python script.py",
              duration: "1m",
            },
            "step-2": {
              backend_job_id: "job-other",
              job_name: "step-2",
              status: "finished",
              logs: makeLogs("job-other"),
              compute_backend: "kubernetes",
              docker_img: "python:3.11",
              cmd: "python other.py",
              duration: "2m",
            },
          },
        },
      },
    },
  },
};

// Two components: "other-component" is first (the normalisation fallback when
// no valid URL param is present), "dask-scheduler" is second (the URL target).
// If the component ignores :component and navigates to the first entry,
// "other-component" content appears instead, failing the text assertion below.
const SERVICE_STATE = {
  details: {
    loadingDetails: false,
    details: {
      [WORKFLOW_ID]: {
        logs: {
          engineLogs: "",
          jobLogs: {},
          serviceLogs: {
            dask: [
              {
                component: "other-component",
                content: makeLogs("other-component"),
              },
              {
                component: COMPONENT_NAME,
                content: makeLogs("dask-scheduler"),
              },
            ],
          },
        },
      },
    },
  },
};

function renderJobLogs(entry) {
  const workflow = { id: WORKFLOW_ID, status: "finished", services: [] };
  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route
          path="/workflows/:id/:tab/:job?"
          element={
            <>
              <WorkflowLogs workflow={workflow} />
              <CurrentLocation />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function renderServiceLogs(entry) {
  const workflow = {
    id: WORKFLOW_ID,
    status: "finished",
    services: ["dask"],
  };
  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route
          path="/workflows/:id/:tab/:job?"
          element={
            <>
              <WorkflowLogs workflow={workflow} service />
              <CurrentLocation />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockScrollToIndex.mockClear();
  mockDispatch.mockClear();
});

test("expired logs display the cluster retention message", () => {
  mockState = {
    details: {
      loadingDetails: false,
      details: {
        [WORKFLOW_ID]: {
          logs: {
            logsPrunedAt: "2026-07-13T03:00:00Z",
            logsPrunedMessage:
              "The logs for this run were pruned by the cluster's retention policy on 2026-07-13T03:00:00Z and are no longer available.",
          },
        },
      },
    },
  };

  renderJobLogs(`/workflows/${WORKFLOW_ID}/job-logs`);

  expect(screen.getByText("Workflow logs expired")).toBeInTheDocument();
  expect(
    screen.getByText(/pruned by the cluster's retention policy/),
  ).toBeInTheDocument();
});

test("job-logs/:job#L42 — correct job is selected and line 42 is highlighted", async () => {
  mockState = JOB_STATE;
  renderJobLogs(`/workflows/${WORKFLOW_ID}/job-logs/${JOB_ID}#L42`);

  await waitFor(() =>
    expect(mockScrollToIndex).toHaveBeenCalledWith(41, { align: "start" }),
  );
  expect(
    screen.getByLabelText("Clear log line selection from line 42")
      .parentElement,
  ).toHaveClass("selected");

  // Unique text from job-abc's logs proves the :job param drove selection,
  // not the default fallback (which would show "job-other: line 42").
  expect(screen.getByText("job-abc: line 42")).toBeInTheDocument();
});

test("job-logs#L42 (no :job param) — defaults to last job and highlights line 42", async () => {
  mockState = JOB_STATE;
  // No :job segment — JobLogs falls back to allJobs.at(-1), which is "job-other".
  renderJobLogs(`/workflows/${WORKFLOW_ID}/job-logs#L42`);

  await waitFor(() =>
    expect(mockScrollToIndex).toHaveBeenCalledWith(41, { align: "start" }),
  );
  expect(
    screen.getByLabelText("Clear log line selection from line 42")
      .parentElement,
  ).toHaveClass("selected");
  // "job-other" is the default (last) job; if selection were driven by position
  // rather than the URL, "job-abc" (first) would appear here instead.
  expect(screen.getByText("job-other: line 42")).toBeInTheDocument();
});

test("job-logs/unknown#L42 — falls back to default job and preserves line anchor", async () => {
  mockState = JOB_STATE;
  renderJobLogs(`/workflows/${WORKFLOW_ID}/job-logs/unknown#L42`);

  await waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/workflows/${WORKFLOW_ID}/job-logs/job-other#L42`,
    ),
  );
  await waitFor(() =>
    expect(mockScrollToIndex).toHaveBeenCalledWith(41, { align: "start" }),
  );
  expect(
    screen.getByLabelText("Clear log line selection from line 42")
      .parentElement,
  ).toHaveClass("selected");
  expect(screen.getByText("job-other: line 42")).toBeInTheDocument();
});

test("service-logs/:component#L42 — correct component is selected and line 42 is highlighted", async () => {
  mockState = SERVICE_STATE;
  renderServiceLogs(
    `/workflows/${WORKFLOW_ID}/service-logs/${COMPONENT_NAME}#L42`,
  );

  await waitFor(() =>
    expect(mockScrollToIndex).toHaveBeenCalledWith(41, { align: "start" }),
  );
  expect(
    screen.getByLabelText("Clear log line selection from line 42")
      .parentElement,
  ).toHaveClass("selected");

  // Unique text from dask-scheduler's logs proves the :component param drove
  // selection, not the normalisation fallback (which would show "other-component: line 42").
  expect(screen.getByText("dask-scheduler: line 42")).toBeInTheDocument();
});

test("service-logs#L42 — normalizes to first component and preserves line anchor", async () => {
  mockState = SERVICE_STATE;
  renderServiceLogs(`/workflows/${WORKFLOW_ID}/service-logs#L42`);

  await waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/workflows/${WORKFLOW_ID}/service-logs/other-component#L42`,
    ),
  );
  await waitFor(() =>
    expect(mockScrollToIndex).toHaveBeenCalledWith(41, { align: "start" }),
  );
  expect(
    screen.getByLabelText("Clear log line selection from line 42")
      .parentElement,
  ).toHaveClass("selected");
  expect(screen.getByText("other-component: line 42")).toBeInTheDocument();
});

test("service-logs/other-component#L42 — first component selected explicitly and line 42 is highlighted", async () => {
  mockState = SERVICE_STATE;
  // "other-component" is the first entry (the normalisation default), but here
  // it is reached via an explicit URL param rather than a fallback redirect.
  renderServiceLogs(
    `/workflows/${WORKFLOW_ID}/service-logs/other-component#L42`,
  );

  await waitFor(() =>
    expect(mockScrollToIndex).toHaveBeenCalledWith(41, { align: "start" }),
  );
  expect(
    screen.getByLabelText("Clear log line selection from line 42")
      .parentElement,
  ).toHaveClass("selected");
  // "dask-scheduler: line 42" must be absent — if the component ignored the
  // param and selected by index it could render the wrong entry.
  expect(screen.getByText("other-component: line 42")).toBeInTheDocument();
  expect(screen.queryByText("dask-scheduler: line 42")).not.toBeInTheDocument();
});
