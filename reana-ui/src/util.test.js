import {
  formatDuration,
  formatFileSize,
  formatSearch,
  getDuration,
  getMimeType,
  parseWorkflowDates,
} from "~/util";

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
