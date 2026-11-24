/*
  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2024, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import {
  formatDuration,
  formatFileSize,
  formatSearch,
  formatValidationWarnings,
  getDocsPageURL,
  getDuration,
  getMimeType,
  parseWorkflowDates,
} from "~/util";

test("formats legacy validation warning dictionaries", () => {
  expect(
    formatValidationWarnings({
      additional_properties: [{ property: "resources", path: "workflow" }],
      parameters: ["Input parameter 'events' is not used."],
    }),
  ).toEqual([
    "Unexpected properties found in the REANA specification: resources (at workflow).",
    "parameters: Input parameter 'events' is not used.",
  ]);
});

test.each([
  [
    "a message without punctuation",
    { message: "Unexpected property 'resources'", path: "workflow" },
    "Unexpected property 'resources' (at workflow).",
  ],
  [
    "a message ending in a full stop",
    { message: "Unexpected property 'resources'.", path: "workflow" },
    "Unexpected property 'resources' (at workflow).",
  ],
  [
    "an exclamation mark",
    { message: "Check this setting!", path: "workflow" },
    "Check this setting (at workflow)!",
  ],
  [
    "a question mark",
    { message: "Is this setting intended?", path: "workflow" },
    "Is this setting intended (at workflow)?",
  ],
  [
    "a deprecation message that already contains its path",
    {
      code: "deprecated_parameters_input",
      message:
        "inputs.parameters.input is deprecated; use workflow.parameters.file instead.",
      path: "inputs.parameters.input",
    },
    "inputs.parameters.input is deprecated; use workflow.parameters.file instead.",
  ],
  [
    "an image warning that already contains its path",
    {
      code: "image_tag",
      message:
        'Using "python:latest" without a fixed tag harms reproducibility; pin an explicit version.',
      path: "python:latest",
    },
    'Using "python:latest" without a fixed tag harms reproducibility; pin an explicit version.',
  ],
  [
    "a code without a message",
    { code: "additional_properties", path: "workflow" },
    "additional_properties (at workflow).",
  ],
])("formats structured validation warnings with %s", (_, warning, expected) => {
  expect(formatValidationWarnings([warning])).toEqual([expected]);
});

test.each([
  ["path/to/test.txt", "text/plain"],
  ["workflow.log", "text/plain"],
  ["foo/bar/Snakefile", "text/plain"],
  ["reana.yaml", "text/yaml"],
  ["script.py", "text/x-python"],
  ["gendata.c", "text/x-c"],
  ["report.html", "text/html"],
  ["data.json", "application/json"],
  ["script.js", "application/javascript"],
  ["plot.png", "image/png"],
  ["pie.jpg", "image/jpeg"],
  ["data.root", "application/x-root"],
  ["plot.pdf", "application/pdf"],
  ["foo", null],
])("getMimeType(%p) === %p", (fileName, mimeType) => {
  expect(getMimeType(fileName)).toBe(mimeType);
});

test.each([
  ["Snakefile", '{"name":["Snakefile"]}'],
  [null, null],
])("formatSearch(%p) === %p", (term, formattedTerm) => {
  expect(formatSearch(term)).toEqual(formattedTerm);
});

test.each([
  [null, null, null],
  [null, "2022-10-07T08:30:00", null],
  ["2022-10-07T08:30:00", "2022-10-07T08:30:30", "30 seconds"],
  ["2022-10-07T08:30:00", "2022-10-07T08:31:30", "1 min 30 sec"],
  ["2022-10-07T08:30:00", "2022-10-07T09:31:30", "1h 1m 30s"],
])(
  "formatDuration(getDuration(%p, %p) === %p",
  (start, end, formattedDuration) => {
    expect(formatDuration(getDuration(start, end))).toEqual(formattedDuration);
  },
);

test.each([
  [0, "0 Bytes"],
  [123, "123 Bytes"],
  [1.05 * 1024, "1.05 KiB"],
  [3 * 1024 ** 3, "3 GiB"],
  [-123, "-123 Bytes"],
  [-1.05 * 1024, "-1.05 KiB"],
  [-3 * 1024 ** 3, "-3 GiB"],
])("formatFileSize(%p) === %p", (fileSize, formattedFileSize) => {
  expect(formatFileSize(fileSize)).toEqual(formattedFileSize);
});

test.each([
  ["finished", "15 min 0 sec", { run_finished_at: "2024-01-18T08:45:00" }],
  ["failed", "15 min 0 sec", { run_finished_at: "2024-01-18T08:45:00" }],
  ["stopped", "10 min 0 sec", { run_stopped_at: "2024-01-18T08:40:00" }],
  ["running", "20 min 0 sec", {}],
  ["queued", "20 min 0 sec", {}],
  ["pending", "20 min 0 sec", {}],
  ["created", "20 min 0 sec", {}],
])(
  `parseWorkflowDates [status: %p], duration === %p`,
  (status, duration, progress_override) => {
    const workflow = {
      status: status,
      created: "2024-01-18T08:25:00",
      progress: {
        run_started_at: "2024-01-18T08:30:00",
        run_stopped_at: null,
        run_finished_at: null,
        ...progress_override,
      },
    };

    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 18, 8, 50, 0));
    expect(parseWorkflowDates(workflow).duration).toEqual(duration);
  },
);

test.each([
  ["https://docs.reana.io", "https://docs.reana.io/getting-started/"],
  ["https://docs.reana.io/", "https://docs.reana.io/getting-started/"],
  ["https://example.org/docs/", "https://example.org/docs/getting-started/"],
])("getDocsPageURL joins %p with a page path", (docsURL, expected) => {
  expect(getDocsPageURL(docsURL, "getting-started/")).toEqual(expected);
});

test.each([null, undefined, ""])(
  "getDocsPageURL returns null without a docs URL (%p)",
  (docsURL) => {
    expect(getDocsPageURL(docsURL, "getting-started/")).toBeNull();
  },
);
