/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { render, getByText, fireEvent } from "@testing-library/react";

import { LauncherLabel } from "..";

describe("LauncherLabel", () => {
  test.each([
    {
      label: "Zenodo",
      url: "https://zenodo.org/record/5752285/files/circular-health-data-processing-master.zip?download=1",
    },
    {
      label: "GitHub",
      url: "https://github.com/reanahub/reana-demo-helloworld.git",
    },
    {
      label: "URL",
      url: "https://example.org/reana.yaml",
    },
  ])("displays $label launcher label", async ({ label, url }) => {
    const baseDom = render(<LauncherLabel url={url} />);
    const container = document.querySelector(".label");
    expect(getByText(container, label));

    expect(baseDom.queryByText(url)).toBeNull();
    fireEvent.mouseOver(container);
    expect(await baseDom.findByText(url)).toBeInTheDocument();
  });

  test("displays no label when no launcher source", async () => {
    render(<LauncherLabel />);
    const container = document.querySelector(".label");
    expect(container).toBeNull();
  });
});
