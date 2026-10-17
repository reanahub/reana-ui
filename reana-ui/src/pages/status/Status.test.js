/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen, waitFor } from "@testing-library/react";

import client from "~/client";
import Status from "./Status";
import styles from "./Status.module.scss";

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));
jest.mock("../BasePage", () => ({ children }) => <>{children}</>);
jest.mock("~/components", () => ({
  PieChart: () => <div data-testid="pie-chart" />,
  Title: ({ children }) => <h1>{children}</h1>,
}));

beforeEach(() => {
  jest.spyOn(client, "getClusterInfo").mockResolvedValue({ data: {} });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("explains zero workflow availability on a busy cluster", async () => {
  jest.spyOn(client, "getClusterStatus").mockResolvedValue({
    data: {
      node: {
        available: 3,
        unschedulable: 0,
        total: 3,
        percentage: 100,
        health: "healthy",
        sort: 0,
      },
      job: {
        running: 30,
        pending: 0,
        available: 0,
        total: 30,
        percentage: 0,
        health: "critical",
        sort: 1,
      },
      workflow: {
        running: 30,
        pending: 0,
        queued: 12,
        available: 0,
        total: 30,
        percentage: 0,
        health: "critical",
        sort: 2,
      },
      session: { active: 0, sort: 3 },
    },
  });

  render(<Status />);

  await waitFor(() => expect(screen.getAllByText("0%")).toHaveLength(2));

  expect(screen.getByText("12 queued")).toHaveClass(styles.critical);
});
