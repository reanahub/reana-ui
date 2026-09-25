/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import {
  Fragment,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "semantic-ui-react";
import CopyButton from "./CopyButton";
import { applyStyleSpans, parseAnsiLines, resolveStyle } from "./ansi";
import LogSearchBar from "./LogSearchBar";
import styles from "./LogViewer.module.scss";

const ROW_HEIGHT = 28;
const OVERSCAN = 30;
const TAB_SIZE = 4;
const COPY_CHECK_TIMEOUT = 750;
const MATCH_LIMIT = 10000;

export function splitLogLines(logs) {
  if (!logs) return [];

  const lines = logs.replace(/\r\n?/g, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

export function parseLogFragment(hash, lineCount) {
  const match = /^#L([1-9]\d*)(?:-([1-9]\d*))?$/.exec(hash);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2] || match[1]);
  if (first > second) return null;

  return second <= lineCount ? { start: first, end: second } : null;
}

function getRenderedLineLength(line) {
  return line.replaceAll("\t", " ".repeat(TAB_SIZE)).length;
}

// Compile a plain search query into a regular expression. Regex metacharacters
// are escaped (the search is plain-text, not regex). Each run of whitespace in
// the query becomes `\s{k,}` (k = its length), so a query matches across line
// breaks and indentation as long as the gap holds *at least* as many whitespace
// characters as were typed — newlines count as one each, and typing more spaces
// requires a larger gap (`\s{1,}` is just today's `\s+`). Returns `null` for an
// empty query.
export function buildSearchRegex(
  query,
  { caseSensitive = false, wholeWord = false } = {},
) {
  if (!query || !query.trim()) return null;

  let pattern = query
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, (run) => `\\s{${run.length},}`);
  if (wholeWord) pattern = `\\b${pattern}\\b`;

  try {
    return new RegExp(pattern, caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

// Scan the full log text for all (non-overlapping) matches of `regex`, returning
// their `[start, end)` character offsets. Capped at `limit` to keep memory and
// rendering bounded for short queries that match very often.
export function findMatches(text, regex, limit = MATCH_LIMIT) {
  if (!regex) return { ranges: [], capped: false };

  const ranges = [];
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[0] === "") {
      // Guard against zero-length matches looping forever.
      regex.lastIndex += 1;
      continue;
    }
    ranges.push([match.index, match.index + match[0].length]);
    if (ranges.length >= limit) {
      return { ranges, capped: true };
    }
  }
  return { ranges, capped: false };
}

// Prefix-sum of character offsets where each line begins in `lines.join("\n")`.
// Line `i` occupies `[offsets[i], offsets[i] + lines[i].length)`.
export function computeLineOffsets(lines) {
  const offsets = new Array(lines.length);
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    offsets[i] = acc;
    acc += lines[i].length + 1; // +1 for the "\n" joining the lines
  }
  return offsets;
}

// Index of the line containing a given character offset (largest `i` with
// `offsets[i] <= offset`), via binary search.
export function offsetToLine(offsets, offset) {
  let lo = 0;
  let hi = offsets.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] <= offset) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

// Split a single line into ordered fragments for rendering, intersecting the
// (sorted, non-overlapping) global `matches` with this line's character range.
// A match that crosses a line boundary highlights only the portion on this line.
export function getLineSegments(line, lineStart, matches, activeIndex) {
  if (!matches || matches.length === 0 || line.length === 0) {
    return [{ text: line, highlight: "none" }];
  }

  const lineEnd = lineStart + line.length;

  // First match whose end falls within (or after) this line.
  let lo = 0;
  let hi = matches.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (matches[mid].end > lineStart) hi = mid;
    else lo = mid + 1;
  }

  const segments = [];
  let cursor = 0;
  for (let i = lo; i < matches.length && matches[i].start < lineEnd; i++) {
    const localStart = Math.max(0, matches[i].start - lineStart);
    const localEnd = Math.min(line.length, matches[i].end - lineStart);
    if (localEnd <= localStart) continue;

    if (localStart > cursor) {
      segments.push({
        text: line.slice(cursor, localStart),
        highlight: "none",
      });
    }
    segments.push({
      text: line.slice(localStart, localEnd),
      highlight: i === activeIndex ? "current" : "match",
    });
    cursor = localEnd;
  }

  if (segments.length === 0) return [{ text: line, highlight: "none" }];
  if (cursor < line.length) {
    segments.push({ text: line.slice(cursor), highlight: "none" });
  }
  return segments;
}

// New horizontal scroll offset so a match (at `markLeft`..`markLeft+markWidth`
// in scroll coordinates) is brought into view with a `margin` of context.
// Returns the current `scrollLeft` unchanged when the match is already visible.
export function revealHorizontalOffset(
  scrollLeft,
  clientWidth,
  markLeft,
  markWidth,
  margin = 80,
) {
  const markRight = markLeft + markWidth;
  if (markLeft < scrollLeft + margin) {
    return Math.max(0, markLeft - margin);
  }
  if (markRight > scrollLeft + clientWidth - margin) {
    return Math.max(0, markRight - clientWidth + margin);
  }
  return scrollLeft;
}

export default function LogViewer({ logs, className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const selectionAnchorRef = useRef(null);
  const skipNextSelectionScrollRef = useRef(false);
  const searchInputRef = useRef(null);
  const hScrolledForRef = useRef(-1);
  const parsedLines = useMemo(
    () => parseAnsiLines(splitLogLines(logs)),
    [logs],
  );
  const lines = useMemo(
    () => parsedLines.map((parsed) => parsed.text),
    [parsedLines],
  );
  const selection = useMemo(
    () => parseLogFragment(location.hash, lines.length),
    [location.hash, lines.length],
  );
  const permalink = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;
  const lineNumberWidth = String(lines.length).length;
  const canvasWidth = useMemo(() => {
    const longestLine = lines.reduce(
      (longest, line) => Math.max(longest, getRenderedLineLength(line)),
      0,
    );
    return `calc(${lineNumberWidth + longestLine + 5}ch + 32px)`;
  }, [lineNumberWidth, lines]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [activeMatch, setActiveMatch] = useState(0);
  const deferredQuery = useDeferredValue(query);
  // Only search while the bar is open, so closing it clears the highlights and
  // avoids computing matches in the background.
  const effectiveQuery = searchOpen ? deferredQuery : "";

  const text = useMemo(() => lines.join("\n"), [lines]);
  const lineOffsets = useMemo(() => computeLineOffsets(lines), [lines]);

  const { matches, capped } = useMemo(() => {
    const regex = buildSearchRegex(effectiveQuery, {
      caseSensitive,
      wholeWord,
    });
    const { ranges, capped } = findMatches(text, regex);
    return {
      matches: ranges.map(([start, end]) => ({
        start,
        end,
        startLine: offsetToLine(lineOffsets, start),
      })),
      capped,
    };
  }, [text, lineOffsets, effectiveQuery, caseSensitive, wholeWord]);

  const activeIndex =
    matches.length > 0 ? Math.min(activeMatch, matches.length - 1) : -1;
  const activeStartLine =
    activeIndex >= 0 ? matches[activeIndex].startLine : -1;

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => index + 1,
    overscan: OVERSCAN,
  });

  useEffect(() => {
    selectionAnchorRef.current = null;
  }, [logs]);

  const lastScrolledHash = useRef(null);

  useEffect(() => {
    if (selection === null) {
      selectionAnchorRef.current = null;
      lastScrolledHash.current = null;
    }
  }, [selection]);

  useEffect(() => {
    if (!selection) return;

    selectionAnchorRef.current = selection.start;
    if (skipNextSelectionScrollRef.current) {
      skipNextSelectionScrollRef.current = false;
      lastScrolledHash.current = location.hash;
      return;
    }
    if (lastScrolledHash.current === location.hash) return;
    lastScrolledHash.current = location.hash;
    virtualizer.scrollToIndex(selection.start - 1, { align: "start" });
  }, [selection, virtualizer, location.hash]);

  // Reset to the first match whenever the query or matching options change.
  useEffect(() => {
    setActiveMatch(0);
    hScrolledForRef.current = -1;
  }, [effectiveQuery, caseSensitive, wholeWord]);

  // Keep the active match scrolled into view (vertically).
  useEffect(() => {
    if (!searchOpen || activeIndex < 0) return;
    virtualizer.scrollToIndex(matches[activeIndex].startLine, {
      align: "center",
    });
  }, [searchOpen, activeIndex, matches, virtualizer]);

  // Bring the active match into view horizontally for very long lines. Done via
  // a ref on the current mark (rather than an effect) so it fires exactly when
  // that mark mounts — including after the vertical scroll above pulls its line
  // into the virtual window. The guard reveals once per navigation and leaves
  // the user's own horizontal scrolling alone.
  const revealActiveMark = useCallback(
    (markEl) => {
      const viewport = viewportRef.current;
      if (!markEl || !viewport) return;
      if (hScrolledForRef.current === activeIndex) return;
      hScrolledForRef.current = activeIndex;

      const markRect = markEl.getBoundingClientRect();
      const viewRect = viewport.getBoundingClientRect();
      const markLeft = markRect.left - viewRect.left + viewport.scrollLeft;
      viewport.scrollLeft = revealHorizontalOffset(
        viewport.scrollLeft,
        viewport.clientWidth,
        markLeft,
        markRect.width,
      );
    },
    [activeIndex],
  );

  const openSearchBar = useCallback(() => {
    setSearchOpen(true);
  }, []);

  // Ctrl+F / Cmd+F opens the in-log find bar when focus is already inside this
  // viewer, leaving native browser find available elsewhere on the page.
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isFindKey =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        (event.key === "f" || event.key === "F");
      if (!isFindKey) return;
      if (!viewportRef.current || viewportRef.current.offsetParent === null) {
        return;
      }
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }
      event.preventDefault();
      openSearchBar();
      const input = searchInputRef.current;
      if (input) {
        input.focus();
        input.select();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openSearchBar]);

  const goToMatch = useCallback(
    (index) => {
      if (matches.length === 0) return;
      setActiveMatch(
        ((index % matches.length) + matches.length) % matches.length,
      );
    },
    [matches.length],
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    viewportRef.current?.focus();
  }, []);

  const selectLine = useCallback(
    (event, lineNumber) => {
      event.preventDefault();

      const isSelected =
        selection &&
        lineNumber >= selection.start &&
        lineNumber <= selection.end;
      if (!event.shiftKey && isSelected) {
        selectionAnchorRef.current = null;
        navigate(
          {
            pathname: location.pathname,
            search: location.search,
          },
          { preventScrollReset: true },
        );
        return;
      }

      let start = lineNumber;
      let end = lineNumber;
      if (event.shiftKey && selectionAnchorRef.current) {
        start = Math.min(selectionAnchorRef.current, lineNumber);
        end = Math.max(selectionAnchorRef.current, lineNumber);
      } else {
        selectionAnchorRef.current = lineNumber;
      }

      const hash = start === end ? `#L${start}` : `#L${start}-${end}`;
      skipNextSelectionScrollRef.current = true;
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash,
        },
        { preventScrollReset: true },
      );
    },
    [location.pathname, location.search, navigate, selection],
  );

  return (
    <div ref={containerRef} className={styles.container}>
      {!searchOpen && (
        <button
          type="button"
          className={styles["search-trigger"]}
          aria-label="Find in logs"
          title="Find in logs"
          onClick={openSearchBar}
        >
          <Icon name="search" fitted />
        </button>
      )}
      {searchOpen && (
        <LogSearchBar
          inputRef={searchInputRef}
          query={query}
          onQueryChange={setQuery}
          matchCount={matches.length}
          activeIndex={activeIndex}
          capped={capped}
          caseSensitive={caseSensitive}
          wholeWord={wholeWord}
          onToggleCaseSensitive={() => setCaseSensitive((value) => !value)}
          onToggleWholeWord={() => setWholeWord((value) => !value)}
          onNext={() => goToMatch(activeIndex + 1)}
          onPrev={() => goToMatch(activeIndex - 1)}
          onClose={closeSearch}
        />
      )}
      <div
        ref={viewportRef}
        className={`${styles.viewport} ${className}`}
        aria-label="Workflow logs"
        role="region"
        tabIndex={0}
      >
        <div
          className={styles.canvas}
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            minWidth: "100%",
            width: canvasWidth,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualLine) => {
            const lineNumber = virtualLine.index + 1;
            const isSelected =
              selection &&
              lineNumber >= selection.start &&
              lineNumber <= selection.end;
            const line = lines[virtualLine.index];
            const { spans } = parsedLines[virtualLine.index];

            return (
              <div
                className={`${styles.line} ${isSelected ? styles.selected : ""}`}
                key={virtualLine.key}
                style={{
                  height: `${virtualLine.size}px`,
                  transform: `translateY(${virtualLine.start}px)`,
                }}
              >
                {selection?.start === lineNumber && (
                  <CopyButton
                    text={permalink}
                    icon="linkify"
                    type="button"
                    className={styles["copy-action"]}
                    aria-label="Copy permalink to selected log lines"
                    timeout={COPY_CHECK_TIMEOUT}
                    dismissOnScroll={true}
                  />
                )}
                <a
                  aria-current={isSelected ? "location" : undefined}
                  aria-label={
                    isSelected
                      ? `Clear log line selection from line ${lineNumber}`
                      : `Select log line ${lineNumber}`
                  }
                  className={styles["line-number"]}
                  href={`#L${lineNumber}`}
                  onClick={(event) => selectLine(event, lineNumber)}
                  style={{ width: `calc(${lineNumberWidth + 2}ch + 32px)` }}
                >
                  {lineNumber}
                </a>
                <span className={styles.content}>
                  {matches.length === 0 && spans.length === 0
                    ? line
                    : applyStyleSpans(
                        matches.length === 0
                          ? [{ text: line, highlight: "none" }]
                          : getLineSegments(
                              line,
                              lineOffsets[virtualLine.index],
                              matches,
                              activeIndex,
                            ),
                        spans,
                      ).map((segment, index) => {
                        const { classNames, css } = resolveStyle(segment.style);
                        const styled = classNames.length > 0 || css;

                        // Nested inside the styling so a background cannot
                        // paint over the match.
                        const body =
                          segment.highlight === "none" ? (
                            segment.text
                          ) : (
                            <mark
                              ref={
                                segment.highlight === "current" &&
                                virtualLine.index === activeStartLine
                                  ? revealActiveMark
                                  : undefined
                              }
                              className={`${styles.mark} ${
                                segment.highlight === "current"
                                  ? styles["mark-current"]
                                  : ""
                              }`}
                            >
                              {segment.text}
                            </mark>
                          );

                        if (!styled) {
                          return segment.highlight === "none" ? (
                            body
                          ) : (
                            <Fragment key={index}>{body}</Fragment>
                          );
                        }

                        return (
                          <span
                            key={index}
                            className={
                              classNames.length > 0
                                ? classNames.map((n) => styles[n]).join(" ")
                                : undefined
                            }
                            style={css ?? undefined}
                          >
                            {body}
                          </span>
                        );
                      })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

LogViewer.propTypes = {
  logs: PropTypes.string.isRequired,
  className: PropTypes.string,
};
