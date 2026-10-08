/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import {
  adaptForeground,
  applySgr,
  applyStyleSpans,
  CONTROL_STRING_LIMIT,
  MAX_SPANS_PER_LINE,
  paletteToRgb,
  parseAnsiLines,
  parseSgrGroups,
  relativeLuminance,
  resolveStyle,
  textOnBackground,
} from "~/components/ansi";

const ESC = "\u001b";
const BEL = "\u0007";
const ST = `${ESC}\\`;

const sgr = (body) => parseSgrGroups(ESC + body);

describe("applySgr", () => {
  test.each([
    [`[1;3m`, {}, { bold: true, italic: true }],
    [`[23m`, { bold: true, italic: true }, { bold: true }],
    [`[0;31m`, { bold: true, underline: true }, { foreground: 1 }],
    [`[22m`, { bold: true, dim: true, italic: true }, { italic: true }],
    [`[32m`, {}, { foreground: 2 }],
    [`[94m`, {}, { foreground: 12 }],
    [`[41m`, {}, { background: 1 }],
    [`[101m`, {}, { background: 9 }],
  ])("applies %s", (sequence, style, expected) => {
    expect(applySgr(sgr(sequence), style)).toEqual(expected);
  });

  test.each([
    [`[38;5;208m`, { foreground: 208 }],
    [`[38:5:208m`, { foreground: 208 }],
    [`[48;2;10;20;30m`, { background: { red: 10, green: 20, blue: 30 } }],
    [`[38:2::255:0:128m`, { foreground: { red: 255, green: 0, blue: 128 } }],
  ])("reads the extended colour in %s", (sequence, expected) => {
    expect(applySgr(sgr(sequence), {})).toEqual(expected);
  });

  // An unsupported decoration must not reset unrelated attributes.
  test.each([
    [`[1;58;2;255;0;0m`, { bold: true }],
    [`[1;58:2::255:0:0m`, { bold: true }],
    [`[1;59m`, { bold: true }],
  ])(
    "consumes the underline colour in %s without losing style",
    (sequence, expected) => {
      expect(applySgr(sgr(sequence), {})).toEqual(expected);
    },
  );

  test.each([
    [`[4:3m`, { underline: true }],
    [`[4:0m`, {}],
  ])("reads the underline style in %s", (sequence, expected) => {
    expect(applySgr(sgr(sequence), {})).toEqual(expected);
  });

  it("stops at a truncated extended colour", () => {
    expect(applySgr(sgr(`[1;38;5m`), {})).toEqual({ bold: true });
  });
});

describe("colour adaptation", () => {
  test.each([
    [16, { red: 0, green: 0, blue: 0 }],
    [231, { red: 255, green: 255, blue: 255 }],
    [232, { red: 8, green: 8, blue: 8 }],
  ])("resolves palette index %i", (index, expected) => {
    expect(paletteToRgb(index)).toEqual(expected);
  });

  test.each([231, 255, 226])(
    "darkens pale foreground %i until it is legible",
    (index) => {
      const adapted = adaptForeground(paletteToRgb(index));
      expect(relativeLuminance(adapted)).toBeLessThan(0.4);
    },
  );

  it("leaves an already legible foreground alone", () => {
    const dark = { red: 20, green: 30, blue: 40 };
    expect(adaptForeground(dark)).toEqual(dark);
  });

  test.each([
    [{ red: 255, green: 255, blue: 255 }, "#14161d"],
    [{ red: 0, green: 0, blue: 0 }, "#ffffff"],
  ])("picks readable text for background %j", (rgb, expected) => {
    expect(textOnBackground(rgb)).toBe(expected);
  });
});

describe("resolveStyle", () => {
  test.each([
    [undefined, { classNames: [], css: null }],
    [{}, { classNames: [], css: null }],
    [
      { foreground: 1, background: 9 },
      { classNames: ["ansi-bg-9", "ansi-fg-1"], css: null },
    ],
  ])("resolves %j", (style, expected) => {
    expect(resolveStyle(style)).toEqual(expected);
  });

  it("adapts an extended foreground for the light viewport", () => {
    expect(resolveStyle({ foreground: 231 }).css.color).not.toBe(
      "rgb(255, 255, 255)",
    );
  });

  it("keeps a background colour and picks text that reads on it", () => {
    const { css } = resolveStyle({ background: { red: 0, green: 0, blue: 0 } });
    expect(css.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(css.color).toBe("#ffffff");
  });

  it("does not override an explicit foreground on a background", () => {
    const { css } = resolveStyle({
      foreground: { red: 250, green: 250, blue: 250 },
      background: { red: 0, green: 0, blue: 0 },
    });
    expect(css.color).toBe("rgb(250, 250, 250)");
  });

  test.each([
    [
      { bold: true, italic: true, dim: true },
      { fontWeight: "bold", fontStyle: "italic", opacity: 0.7 },
    ],
    [
      { underline: true, strike: true },
      { textDecoration: "underline line-through" },
    ],
  ])("turns %j into inline CSS", (style, css) => {
    expect(resolveStyle(style).css).toEqual(css);
  });

  it("derives readable text when inverse puts an extended colour behind it", () => {
    const { classNames, css } = resolveStyle({
      inverse: true,
      foreground: 231,
    });
    expect(classNames).toEqual([]);
    expect(css.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(css.color).toBe("#14161d");
  });
  test.each([
    [
      { inverse: true, foreground: 1, background: 2 },
      ["ansi-bg-1", "ansi-fg-2"],
    ],
    [{ inverse: true, foreground: 1 }, ["ansi-bg-1", "ansi-fg-default"]],
  ])("swaps the colours of %j", (style, classNames) => {
    expect(resolveStyle(style).classNames).toEqual(classNames);
  });
});

describe("parseAnsiLines", () => {
  test.each([
    ["plain", "plain"],
    ["", ""],
    [`${ESC}[2K${ESC}[1Gprogress`, "progress"],
    [`${ESC}]0;title${BEL}text`, "text"],
    [`${ESC}]8;;http://x${ST}link`, "link"],
    ["a\u0008b\tc", "ab\tc"],
    // Control strings are consumed, payload and all.
    [`${ESC}Pprivate payload${ST}visible`, "visible"],
    [`${ESC}Xsos${ST}after`, "after"],
    [`${ESC}^pm${ST}after`, "after"],
    [`${ESC}_apc${ST}after`, "after"],
    ["\u009b31mred", "31mred"],
  ])("strips %j to plain text", (raw, text) => {
    expect(parseAnsiLines([raw])[0]).toEqual({ text, spans: [] });
  });

  it("records the span an attribute covers", () => {
    const [line] = parseAnsiLines([`a${ESC}[1mbold${ESC}[0mz`]);
    expect(line.text).toBe("aboldz");
    expect(line.spans).toEqual([{ start: 1, end: 5, style: { bold: true } }]);
  });

  it("carries attributes across lines the way a terminal does", () => {
    const parsed = parseAnsiLines([
      `${ESC}[31mred`,
      "still red",
      `done${ESC}[0m`,
    ]);
    expect(parsed.map((line) => line.text)).toEqual([
      "red",
      "still red",
      "done",
    ]);
    expect(parsed[1].spans).toEqual([
      { start: 0, end: 9, style: { foreground: 1 } },
    ]);
  });

  it("does not carry attributes past a reset", () => {
    expect(
      parseAnsiLines([`${ESC}[1mbold${ESC}[0m`, "plain"])[1].spans,
    ).toEqual([]);
  });

  it("merges runs that resolve to the same style", () => {
    const [line] = parseAnsiLines([
      `${ESC}[31mA${ESC}[31mB${ESC}[31mC${ESC}[0m`,
    ]);
    expect(line.text).toBe("ABC");
    expect(line.spans).toEqual([
      { start: 0, end: 3, style: { foreground: 1 } },
    ]);
  });

  it("records separate spans when the style actually changes", () => {
    const [line] = parseAnsiLines([
      `${ESC}[31mred${ESC}[0m plain ${ESC}[1mbold${ESC}[0m`,
    ]);
    expect(line.spans).toEqual([
      { start: 0, end: 3, style: { foreground: 1 } },
      { start: 10, end: 14, style: { bold: true } },
    ]);
  });

  it("caps the number of spans on one line", () => {
    const alternating = Array.from({ length: 5000 }, (_, i) =>
      i % 2 ? `${ESC}[31mx` : `${ESC}[32my`,
    ).join("");
    const [line] = parseAnsiLines([alternating]);
    expect(line.text).toHaveLength(5000);
    expect(line.spans.length).toBeLessThanOrEqual(MAX_SPANS_PER_LINE);
  });

  it("parses a line of unterminated OSC introducers quickly", () => {
    const hostile = `${ESC}]`.repeat(60000);
    const started = Date.now();
    parseAnsiLines([hostile]);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  test.each([
    [`${ESC}Ppayload with no terminator`, "payload with no terminator"],
    [`${ESC}]0;title with no terminator`, "0;title with no terminator"],
  ])("keeps the payload of the incomplete control string %j", (raw, text) => {
    expect(parseAnsiLines([raw])[0].text).toBe(text);
  });

  it("keeps an over-long control string visible rather than deleting the line", () => {
    const payload = "x".repeat(CONTROL_STRING_LIMIT + 10);
    expect(parseAnsiLines([`${ESC}]0;${payload}${BEL}tail`])[0].text).toContain(
      "tail",
    );
  });
});

describe("applyStyleSpans", () => {
  const plain = (text) => [{ text, highlight: "none" }];

  it("returns the segments untouched when there are no spans", () => {
    expect(applyStyleSpans(plain("abc"), [])).toEqual(plain("abc"));
  });

  it("splits a segment at the span boundaries", () => {
    const spans = [{ start: 1, end: 3, style: { bold: true } }];
    expect(applyStyleSpans(plain("abcd"), spans)).toEqual([
      { text: "a", highlight: "none", style: undefined },
      { text: "bc", highlight: "none", style: { bold: true } },
      { text: "d", highlight: "none", style: undefined },
    ]);
  });

  it("keeps highlighting and styling on the same fragment", () => {
    const segments = [
      { text: "ab", highlight: "none" },
      { text: "cd", highlight: "current" },
    ];
    const spans = [{ start: 1, end: 3, style: { foreground: 1 } }];
    expect(applyStyleSpans(segments, spans)).toEqual([
      { text: "a", highlight: "none", style: undefined },
      { text: "b", highlight: "none", style: { foreground: 1 } },
      { text: "c", highlight: "current", style: { foreground: 1 } },
      { text: "d", highlight: "current", style: undefined },
    ]);
  });
});
