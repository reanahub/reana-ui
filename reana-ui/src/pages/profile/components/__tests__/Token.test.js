/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, screen } from "@testing-library/react";

import Token from "../Token";

test("shows the reana-client login command for this server", () => {
  render(<Token />);

  expect(
    screen.getByText("reana-client login --server http://localhost"),
  ).toBeInTheDocument();
  expect(screen.queryByText(/REANA_SERVER_URL/)).toBeNull();
});
