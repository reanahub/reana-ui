/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";

import WorkflowShareModal from "../WorkflowShareModal";

const mockState = {
  workflows: {
    workflowShareModal: {
      open: true,
      workflow: { id: "workflow-id", name: "myanalysis", run: "42" },
    },
  },
  sharing: {
    loadingWorkflowShareStatus: false,
    sharedWith: {
      "workflow-id": {
        sharedWith: [
          {
            userEmail: "bob@example.org",
            validUntil: "2026-01-31T00:00:00",
            expired: true,
          },
          { userEmail: "alice@example.org", validUntil: null, expired: false },
        ],
      },
    },
  },
};

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) => selector(mockState),
}));

test("marks only the expired shares", () => {
  render(<WorkflowShareModal />);

  const labels = screen.getAllByText("Expired");
  expect(labels).toHaveLength(1);
  expect(labels[0].parentElement).toHaveTextContent("bob@example.org");
});
