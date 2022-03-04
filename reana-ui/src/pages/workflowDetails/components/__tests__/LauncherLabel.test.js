/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, getByText } from "@testing-library/react";

import { LauncherLabel } from "..";

test("displays Zenodo launcher label", async () => {
  render(
    <LauncherLabel url="https://zenodo.org/record/5752285/files/circular-health-data-processing-master.zip?download=1" />
  );
  const container = document.querySelector(".label");
  expect(getByText(container, "Zenodo"));
});

test("displays GitHub launcher label", async () => {
  render(
    <LauncherLabel url="https://github.com/reanahub/reana-demo-helloworld.git" />
  );
  const container = document.querySelector(".label");
  expect(getByText(container, "GitHub"));
});

test("displays generic launcher label", async () => {
  render(<LauncherLabel url="https://example.org/reana.yaml" />);
  const container = document.querySelector(".label");
  expect(getByText(container, "URL"));
});

test("displays no label when no launcher source", async () => {
  render(<LauncherLabel />);
  const container = document.querySelector(".label");
  expect(container).toBeNull();
});
