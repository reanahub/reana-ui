import { formatDuration, formatSearch, getDuration, getMimeType } from "~/util";

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
  }
);
