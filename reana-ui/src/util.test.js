import { getMimeType, formatSearch } from "~/util";

test.each([
  ["path/to/test.txt", "text/plain"],
  ["workflow.log", "text/plain"],
  ["foo/bar/Snakefile", "text/plain"],
  ["reana.yaml", "text/yaml"],
  ["script.py", "text/plain"],
  ["gendata.c", "text/x-c"],
  ["report.html", "text/html"],
  ["data.json", "application/json"],
  ["script.js", "application/javascript"],
  ["plot.png", "image/png"],
  ["pie.jpg", "image/jpeg"],
  ["foo", null],
  ["data.root", null],
])("getMimeType(%p) === %p", (fileName, mimeType) => {
  expect(getMimeType(fileName)).toBe(mimeType);
});

test.each([
  ["Snakefile", '{"name":["Snakefile"]}'],
  [null, null],
])("formatSearch(%p) === %p", (term, formattedTerm) => {
  expect(formatSearch(term)).toEqual(formattedTerm);
});
