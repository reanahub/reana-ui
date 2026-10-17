/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import copy from "copy-to-clipboard";

import LogViewer, {
  buildSearchRegex,
  computeLineOffsets,
  findMatches,
  getLineSegments,
  offsetToLine,
  parseLogFragment,
  revealHorizontalOffset,
  splitLogLines,
} from "~/components/LogViewer";

const ESC = "\u001b";

const mockScrollToIndex = jest.fn();

jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }) => ({
    getTotalSize: () => count * 28,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index + 1,
        size: 28,
        start: index * 28,
      })),
    scrollToIndex: mockScrollToIndex,
  }),
}));

jest.mock("copy-to-clipboard", () => jest.fn(() => true));

function CurrentLocation() {
  const location = useLocation();
  return (
    <span data-testid="location">{`${location.search}${location.hash}`}</span>
  );
}

function renderLogViewer(
  initialEntry = "/workflows/1/job-logs/job-1",
  logs = "first\r\nsecond\n\nfourth\n",
) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <LogViewer logs={logs} />
      <CurrentLocation />
    </MemoryRouter>,
  );
}

function makeViewerVisible() {
  const region = screen.getByLabelText("Workflow logs");
  Object.defineProperty(region, "offsetParent", {
    configurable: true,
    get: () => document.body,
  });
  return region;
}

// jsdom does not compute layout, so `offsetParent` is always null; the Ctrl+F
// handler uses it to ignore hidden viewers. Pretend this viewer is visible.
function openSearch() {
  const region = makeViewerVisible();
  region.focus();
  fireEvent.keyDown(document, { key: "f", ctrlKey: true });
}

describe("splitLogLines", () => {
  it("normalizes line endings and preserves internal empty lines", () => {
    expect(splitLogLines("first\r\nsecond\rthird\n\n")).toEqual([
      "first",
      "second",
      "third",
      "",
    ]);
  });

  it("returns no lines for empty logs", () => {
    expect(splitLogLines("")).toEqual([]);
  });
});

describe("parseLogFragment", () => {
  test.each([
    ["#L2", { start: 2, end: 2 }],
    ["#L2-4", { start: 2, end: 4 }],
  ])("parses %s", (hash, expected) => {
    expect(parseLogFragment(hash, 4)).toEqual(expected);
  });

  test.each(["", "#L0", "#L-1", "#L2-", "#L2-5", "#L4-2", "#line2", "#L02"])(
    "ignores invalid or out-of-bounds fragment %s",
    (hash) => {
      expect(parseLogFragment(hash, 4)).toBeNull();
    },
  );
});

describe("buildSearchRegex", () => {
  it("returns null for an empty or whitespace-only query", () => {
    expect(buildSearchRegex("")).toBeNull();
    expect(buildSearchRegex("   ")).toBeNull();
  });

  it("treats the query as plain text, escaping regex metacharacters", () => {
    expect("abc".match(buildSearchRegex("a.c"))).toBeNull();
    expect("xa.cy".match(buildSearchRegex("a.c"))).not.toBeNull();
  });

  it("lets whitespace match across line breaks, counting each newline as one", () => {
    // gap between "123" and "456" is 2 newlines + 8 spaces = 10 whitespace chars
    const text = `123\n\n${" ".repeat(8)}456`;
    for (const k of [1, 2, 8, 9, 10]) {
      const query = `123${" ".repeat(k)}456`;
      expect(text.match(buildSearchRegex(query))).not.toBeNull();
    }
    // more whitespace than the gap holds, or none at all, does not match
    expect(text.match(buildSearchRegex(`123${" ".repeat(11)}456`))).toBeNull();
    expect(text.match(buildSearchRegex("123456"))).toBeNull();
    // a bare newline still joins (one newline satisfies one query space)
    expect("foo\nbar".match(buildSearchRegex("foo bar"))).not.toBeNull();
  });

  it("is case-insensitive by default and case-sensitive on request", () => {
    expect("FOO".match(buildSearchRegex("foo"))).not.toBeNull();
    expect(
      "FOO".match(buildSearchRegex("foo", { caseSensitive: true })),
    ).toBeNull();
  });

  it("matches whole words only when requested", () => {
    const regex = buildSearchRegex("cat", { wholeWord: true });
    expect("category".match(regex)).toBeNull();
    expect("a cat sat".match(regex)).not.toBeNull();
  });
});

describe("findMatches", () => {
  it("returns the offsets of every occurrence", () => {
    expect(findMatches("foo bar foo", buildSearchRegex("foo"))).toEqual({
      ranges: [
        [0, 3],
        [8, 11],
      ],
      capped: false,
    });
  });

  it("finds a single match that spans a line break", () => {
    expect(findMatches("foo\nbar", buildSearchRegex("foo bar"))).toEqual({
      ranges: [[0, 7]],
      capped: false,
    });
  });

  it("caps the number of matches", () => {
    const result = findMatches("aaaa", buildSearchRegex("a"), 2);
    expect(result.ranges).toHaveLength(2);
    expect(result.capped).toBe(true);
  });

  it("returns nothing for a null regex and never loops on zero-length matches", () => {
    expect(findMatches("abc", null)).toEqual({ ranges: [], capped: false });
    expect(findMatches("abc", /x*/g)).toEqual({ ranges: [], capped: false });
  });
});

describe("computeLineOffsets / offsetToLine", () => {
  it("computes the start offset of each line", () => {
    expect(computeLineOffsets(["ab", "cde", ""])).toEqual([0, 3, 7]);
  });

  it("maps an offset back to its line", () => {
    const offsets = [0, 3, 7];
    expect(offsetToLine(offsets, 0)).toBe(0);
    expect(offsetToLine(offsets, 2)).toBe(0);
    expect(offsetToLine(offsets, 3)).toBe(1);
    expect(offsetToLine(offsets, 6)).toBe(1);
    expect(offsetToLine(offsets, 7)).toBe(2);
    expect(offsetToLine(offsets, 100)).toBe(2);
  });
});

describe("getLineSegments", () => {
  it("returns a single plain segment when there are no matches", () => {
    expect(getLineSegments("hello", 0, [], -1)).toEqual([
      { text: "hello", highlight: "none" },
    ]);
  });

  it("splits a line around a match and flags the active one", () => {
    const matches = [{ start: 6, end: 11 }];
    expect(getLineSegments("hello world", 0, matches, -1)).toEqual([
      { text: "hello ", highlight: "none" },
      { text: "world", highlight: "match" },
    ]);
    expect(getLineSegments("hello world", 0, matches, 0)).toEqual([
      { text: "hello ", highlight: "none" },
      { text: "world", highlight: "current" },
    ]);
  });

  it("handles several matches on one line", () => {
    const matches = [
      { start: 0, end: 3 },
      { start: 3, end: 6 },
    ];
    expect(getLineSegments("abcabc", 0, matches, 1)).toEqual([
      { text: "abc", highlight: "match" },
      { text: "abc", highlight: "current" },
    ]);
  });

  it("highlights only this line's portion of a cross-line match", () => {
    const matches = [{ start: 0, end: 7 }]; // spans "foo\nbar"
    expect(getLineSegments("foo", 0, matches, 0)).toEqual([
      { text: "foo", highlight: "current" },
    ]);
    expect(getLineSegments("bar", 4, matches, 0)).toEqual([
      { text: "bar", highlight: "current" },
    ]);
  });
});

describe("revealHorizontalOffset", () => {
  // viewport showing [scrollLeft, scrollLeft + clientWidth); margin = 80
  it("leaves the scroll position untouched when the match is in view", () => {
    expect(revealHorizontalOffset(0, 1000, 200, 50)).toBe(0);
  });

  it("scrolls right to reveal a match past the right edge", () => {
    expect(revealHorizontalOffset(0, 1000, 5000, 50)).toBe(4130); // 5050 - 1000 + 80
  });

  it("scrolls left to reveal a match before the left edge", () => {
    expect(revealHorizontalOffset(4130, 1000, 100, 50)).toBe(20); // 100 - 80
  });

  it("never returns a negative offset", () => {
    expect(revealHorizontalOffset(50, 1000, 10, 50)).toBe(0);
  });
});

describe("LogViewer", () => {
  beforeEach(() => {
    copy.mockClear();
    mockScrollToIndex.mockClear();
  });

  it("renders line links and highlights an incoming range", async () => {
    const { container } = renderLogViewer(
      "/workflows/1/job-logs/job-1?view=full#L2-3",
    );

    expect(screen.getByLabelText("Select log line 4")).toBeInTheDocument();
    expect(screen.getByText("second").parentElement).toHaveClass("selected");
    expect(
      screen.getByLabelText("Clear log line selection from line 3")
        .parentElement,
    ).toHaveClass("selected");
    expect(container.querySelectorAll(".selected")).toHaveLength(2);
    await waitFor(() =>
      expect(mockScrollToIndex).toHaveBeenCalledWith(1, { align: "start" }),
    );
  });

  it("renders terminal attributes as styling and hides the escape sequences", () => {
    const { container } = renderLogViewer(
      "/workflows/1/job-logs/job-1",
      `plain ${ESC}[1;31mloud${ESC}[0m tail\n`,
    );

    const content = container.querySelector(".content");
    expect(content).toHaveTextContent("plain loud tail");
    expect(content.textContent).not.toContain("[1;31m");

    const styled = screen.getByText("loud");
    expect(styled).toHaveStyle({ fontWeight: "bold" });
    expect(styled).toHaveClass("ansi-fg-1");
  });

  it("renders a 256-colour sequence as an inline colour", () => {
    renderLogViewer(
      "/workflows/1/job-logs/job-1",
      `${ESC}[38;5;208mwarning${ESC}[39m: deprecated\n`,
    );

    // The colour is darkened so it stays legible on the light viewport.
    const styled = screen.getByText("warning");
    expect(styled).toHaveStyle({ color: "rgb(204, 108, 0)" });
    expect(styled.className).toBe("");
  });

  it("leaves plain lines as bare text without wrapper elements", () => {
    const { container } = renderLogViewer(
      "/workflows/1/job-logs/job-1",
      "nothing special here\n",
    );

    const content = container.querySelector(".content");
    expect(content).toHaveTextContent("nothing special here");
    expect(content.querySelector("span")).toBeNull();
  });

  it("searches the visible text, not the escape sequences", async () => {
    const { container } = renderLogViewer(
      "/workflows/1/job-logs/job-1",
      `${ESC}[32minstalled${ESC}[0m\n`,
    );

    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Find in logs"), {
      target: { value: "installed" },
    });

    await waitFor(() =>
      expect(container.querySelectorAll("mark")).toHaveLength(1),
    );
    // The colour survives the highlight instead of being replaced by it.
    expect(container.querySelector(".ansi-fg-2 mark")).not.toBeNull();
  });

  it("splits a match that straddles a colour change, keeping both colours", async () => {
    const { container } = renderLogViewer(
      "/workflows/1/job-logs/job-1",
      `${ESC}[31mERR${ESC}[32mOR${ESC}[0m tail\n`,
    );

    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Find in logs"), {
      target: { value: "error" },
    });

    await waitFor(() =>
      expect(container.querySelectorAll("mark")).toHaveLength(2),
    );
    expect(screen.getByText("1 / 1")).toBeInTheDocument();

    expect(container.querySelector(".ansi-fg-1 mark")).not.toBeNull();
    expect(container.querySelector(".ansi-fg-2 mark")).not.toBeNull();
    expect(container.querySelector(".content")).toHaveTextContent("ERROR tail");
  });

  it("keeps the match indicator visible over an ANSI background", async () => {
    const { container } = renderLogViewer(
      "/workflows/1/job-logs/job-1",
      `${ESC}[41mfailed${ESC}[0m\n`,
    );

    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Find in logs"), {
      target: { value: "failed" },
    });

    await waitFor(() =>
      expect(container.querySelectorAll("mark")).toHaveLength(1),
    );
    expect(container.querySelector(".ansi-bg-1 mark")).not.toBeNull();
  });

  it("keeps line numbering and selection working on styled logs", () => {
    renderLogViewer(
      "/workflows/1/job-logs/job-1#L2",
      `${ESC}[1mfirst\nsecond${ESC}[0m\n`,
    );

    expect(screen.getByText("second").closest(".line")).toHaveClass("selected");
    expect(screen.getByLabelText("Select log line 1")).toBeInTheDocument();
  });

  it("updates the fragment while preserving the query string", async () => {
    renderLogViewer("/workflows/1/job-logs/job-1?view=full");

    fireEvent.click(screen.getByLabelText("Select log line 2"));
    expect(screen.getByTestId("location")).toHaveTextContent("?view=full#L2");
    expect(mockScrollToIndex).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Select log line 4"), {
      shiftKey: true,
    });
    expect(screen.getByTestId("location")).toHaveTextContent("?view=full#L2-4");
    expect(mockScrollToIndex).not.toHaveBeenCalled();
  });

  it("clears the selection when a selected line is clicked", () => {
    renderLogViewer("/workflows/1/job-logs/job-1?view=full#L2-3");

    fireEvent.click(
      screen.getByLabelText("Clear log line selection from line 2"),
    );

    expect(screen.getByTestId("location")).toHaveTextContent("?view=full");
    expect(screen.getByText("second").parentElement).not.toHaveClass(
      "selected",
    );
  });

  it("copies the complete permalink from a keyboard-accessible button", async () => {
    renderLogViewer("/workflows/1/job-logs/job-1?view=full#L2-3");

    const copyButton = screen.getByRole("button", {
      name: "Copy permalink to selected log lines",
    });
    expect(copyButton).toHaveAttribute("type", "button");
    expect(copyButton.parentElement).toHaveTextContent("2second");

    fireEvent.click(copyButton);

    await waitFor(() =>
      expect(copy).toHaveBeenCalledWith(
        "http://localhost/workflows/1/job-logs/job-1?view=full#L2-3",
        { format: "text/plain" },
      ),
    );
  });

  it("opens the find bar from a visible keyboard-accessible search button", async () => {
    renderLogViewer();

    const searchButton = screen.getByRole("button", { name: "Find in logs" });
    expect(searchButton).toHaveAttribute("type", "button");

    fireEvent.click(searchButton);

    const input = screen.getByPlaceholderText("Find in logs");
    await waitFor(() => expect(input).toHaveFocus());
    expect(screen.getByText("Searches the full log")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Find in logs" }),
    ).not.toBeInTheDocument();
  });

  it("opens the find bar on Ctrl+F when the viewer is focused and highlights matches", async () => {
    renderLogViewer();
    expect(screen.queryByPlaceholderText("Find in logs")).toBeNull();

    openSearch();
    const input = screen.getByPlaceholderText("Find in logs");
    expect(input).toBeInTheDocument();
    expect(screen.getByText("Searches the full log")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "first" } });

    const mark = await screen.findByText("first");
    expect(mark.tagName).toBe("MARK");
    expect(mark).toHaveClass("mark-current");
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("leaves browser find alone when Ctrl+F is pressed outside the viewer", () => {
    renderLogViewer();
    makeViewerVisible();

    const event = new KeyboardEvent("keydown", {
      key: "f",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = jest.spyOn(event, "preventDefault");
    document.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("Find in logs")).toBeNull();
  });

  it("highlights a match spanning a line break", async () => {
    renderLogViewer();
    openSearch();

    fireEvent.change(screen.getByPlaceholderText("Find in logs"), {
      target: { value: "first second" },
    });

    await waitFor(() => expect(screen.getByText("1 / 1")).toBeInTheDocument());
    expect(screen.getByText("first").tagName).toBe("MARK");
    expect(screen.getByText("second").tagName).toBe("MARK");
  });

  it("steps through matches with Enter and Shift+Enter", async () => {
    renderLogViewer("/workflows/1/job-logs/job-1", "foo\nbar\nfoo\nbaz");
    openSearch();
    const input = screen.getByPlaceholderText("Find in logs");
    fireEvent.change(input, { target: { value: "foo" } });

    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());

    mockScrollToIndex.mockClear();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(mockScrollToIndex).toHaveBeenCalledWith(2, { align: "center" });

    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("respects the case-sensitive toggle", async () => {
    renderLogViewer();
    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Find in logs"), {
      target: { value: "FIRST" },
    });

    await waitFor(() => expect(screen.getByText("1 / 1")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Match case"));
    expect(await screen.findByText("No results")).toBeInTheDocument();
  });

  it("respects the whole-word toggle", async () => {
    renderLogViewer("/workflows/1/job-logs/job-1", "cat\ncategory\ncat");
    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Find in logs"), {
      target: { value: "cat" },
    });

    await waitFor(() => expect(screen.getByText("1 / 3")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Match whole word"));
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
  });

  it("closes the find bar on Escape and clears highlights", async () => {
    const { container } = renderLogViewer();
    openSearch();
    const input = screen.getByPlaceholderText("Find in logs");
    fireEvent.change(input, { target: { value: "first" } });
    await screen.findByText("1 / 1");
    expect(container.querySelector("mark")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByPlaceholderText("Find in logs")).toBeNull();
    expect(container.querySelector("mark")).toBeNull();
  });

  it("closes the find bar on Escape", () => {
    renderLogViewer();
    openSearch();
    const input = screen.getByPlaceholderText("Find in logs");

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByPlaceholderText("Find in logs")).toBeNull();
  });
});
