/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";

import {
  CONFIG_RECEIVED,
  WORKFLOWS_RECEIVED,
  fetchUsersSharedWithYou,
  fetchWorkflows,
  workflowListQueryKey,
} from "~/actions";
import reducer from "~/reducers";
import WorkflowListPage from "./WorkflowList";
import {
  parseWorkflowListQuery,
  serializeQueryToApiParams,
} from "./workflowListQuery";

jest.mock("~/actions", () => ({
  ...jest.requireActual("~/actions"),
  fetchWorkflows: jest.fn(),
  fetchUsersSharedWithYou: jest.fn(),
}));

jest.mock("../BasePage", () => ({ children }) => <>{children}</>);
jest.mock("./components/WorkflowList", () => () => (
  <div data-testid="workflow-list" />
));

const routerFutureFlags = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
};

// CRA forces `resetMocks: true`, so implementations are set per test.
beforeEach(() => {
  fetchWorkflows.mockReturnValue({ type: "TEST_NOOP" });
  fetchUsersSharedWithYou.mockReturnValue({ type: "TEST_NOOP" });
});

const router = { location: null, navigate: null };

function RouterProbe() {
  router.location = useLocation();
  router.navigate = useNavigate();
  return null;
}

/** The key the page derives for a given list URL, via the real query pipeline. */
const listKeyFor = (search) =>
  workflowListQueryKey(
    serializeQueryToApiParams(
      parseWorkflowListQuery(new URLSearchParams(search)),
    ),
  );

const WORKFLOWS = { wf1: { id: "wf1", name: "analysis", status: "finished" } };

function setup({ entries, index = entries.length - 1 }) {
  const store = createStore(reducer, applyMiddleware(thunk));
  store.dispatch({ type: CONFIG_RECEIVED });

  const receiveList = (total, search) =>
    store.dispatch({
      type: WORKFLOWS_RECEIVED,
      workflows: WORKFLOWS,
      total,
      userHasWorkflows: true,
      queryKey: listKeyFor(search),
    });

  // What `fetchWorkflow()` leaves behind: the same slice of the store, but a
  // total describing one workflow rather than a list page.
  const receiveSingleWorkflow = () =>
    store.dispatch({
      type: WORKFLOWS_RECEIVED,
      workflows: WORKFLOWS,
      total: 1,
      userHasWorkflows: true,
      queryKey: workflowListQueryKey({ workflowIdOrName: "wf1" }),
    });

  const renderPage = () =>
    render(
      <Provider store={store}>
        <MemoryRouter
          future={routerFutureFlags}
          initialEntries={entries}
          initialIndex={index}
        >
          <RouterProbe />
          <WorkflowListPage />
        </MemoryRouter>
      </Provider>,
    );

  return { store, receiveList, receiveSingleWorkflow, renderPage };
}

test("keeps a valid page when the total came from a single-workflow fetch", async () => {
  const { receiveList, receiveSingleWorkflow, renderPage } = setup({
    entries: ["/", "/?page=3"],
  });

  // page 3 of 25 is valid, then opening workflow details overwrites the total
  receiveList(25, "?page=3");
  receiveSingleWorkflow();

  await act(async () => {
    renderPage();
  });

  expect(router.location.search).toBe("?page=3");
  // a total that is not ours must not drive the result range either
  expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
});

test("keeps a valid page when the total belongs to a narrower search", async () => {
  const { receiveList, renderPage } = setup({ entries: ["/?page=3"] });

  receiveList(1, "?search=narrow");

  await act(async () => {
    renderPage();
  });

  expect(router.location.search).toBe("?page=3");
});

test("corrects an out-of-range page once the matching total arrives", async () => {
  const { receiveList, renderPage } = setup({ entries: ["/", "/?page=999"] });

  await act(async () => {
    renderPage();
  });
  expect(router.location.search).toBe("?page=999");

  await act(async () => {
    receiveList(25, "?page=999");
  });

  expect(router.location.search).toBe("?page=3");
});

test("corrects the page when a matching total shows the result set shrank", async () => {
  const { receiveList, renderPage } = setup({ entries: ["/?page=3"] });

  await act(async () => {
    renderPage();
  });

  await act(async () => {
    receiveList(5, "?page=3");
  });

  expect(router.location.search).toBe("");
});

test("replaces the invalid page in history so Back skips the correction", async () => {
  const { receiveList, renderPage } = setup({ entries: ["/", "/?page=999"] });

  await act(async () => {
    renderPage();
  });
  await act(async () => {
    receiveList(25, "?page=999");
  });
  expect(router.location.search).toBe("?page=3");

  await act(async () => {
    router.navigate(-1);
  });

  // the invalid ?page=999 entry was replaced, so Back reaches the entry before
  // it and no further correction is triggered
  expect(router.location.search).toBe("");
  expect(router.location.pathname).toBe("/");
});
