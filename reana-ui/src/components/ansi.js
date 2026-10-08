/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

// Bounded so unterminated introducers cannot make scanning quadratic.
export const CONTROL_STRING_LIMIT = 4096;

// Past this the rest of the line renders unstyled rather than flooding the DOM.
export const MAX_SPANS_PER_LINE = 2000;

// Only SGR (`CSI … m`) carries text attributes; the rest are dropped.
/* eslint-disable no-control-regex -- matching terminal escapes requires them */
const ESCAPE_SEQUENCE = new RegExp(
  "\u001b(?:" +
    "\\[[0-9;:?]*[ -/]*[@-~]" +
    `|\\][^\u0007\u001b]{0,${CONTROL_STRING_LIMIT}}(?:\u0007|\u001b\\\\)` +
    `|[PX^_][^\u001b]{0,${CONTROL_STRING_LIMIT}}\u001b\\\\` +
    "|[@-Z\\\\-_]" +
    ")",
  "g",
);

// Tabs are excluded: the viewport indents them through `tab-size`.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;
/* eslint-enable no-control-regex */

function isSgr(sequence) {
  return sequence.length > 2 && sequence[1] === "[" && sequence.endsWith("m");
}

// Flattening groups lets an unsupported parameter's arguments read as attributes.
export function parseSgrGroups(sequence) {
  return sequence
    .slice(2, -1)
    .split(";")
    .map((parameter) =>
      parameter.split(":").map((part) => (part === "" ? 0 : Number(part))),
    );
}

// The ITU form adds a colour-space id, so the components are the last three.
function colorFromParts(parts) {
  if (parts[0] === 5) return parts.length > 1 ? parts[1] : null;
  if (parts[0] === 2 && parts.length >= 4) {
    const [red, green, blue] = parts.slice(-3);
    return { red, green, blue };
  }
  return null;
}

function readExtendedColor(groups, index) {
  const group = groups[index];
  if (group.length > 1) {
    const color = colorFromParts(group.slice(1));
    return color === null ? null : { color, consumed: 0 };
  }

  const mode = groups[index + 1] && groups[index + 1][0];
  if (mode === 5 && groups.length > index + 2) {
    return { color: groups[index + 2][0], consumed: 2 };
  }
  if (mode === 2 && groups.length > index + 4) {
    return {
      color: {
        red: groups[index + 2][0],
        green: groups[index + 3][0],
        blue: groups[index + 4][0],
      },
      consumed: 4,
    };
  }
  return null;
}

export function applySgr(groups, style) {
  let next = { ...style };

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const parameter = group[0];

    // 58 is the underline colour: consumed, not drawn.
    if (parameter === 38 || parameter === 48 || parameter === 58) {
      const extended = readExtendedColor(groups, i);
      if (!extended) return next;
      if (parameter !== 58) {
        next[parameter === 38 ? "foreground" : "background"] = extended.color;
      }
      i += extended.consumed;
      continue;
    }
    if (parameter === 59) continue;

    // `4:0` turns the underline off, `4:1` to `4:5` pick a style we do not draw.
    if (parameter === 4 && group.length > 1) {
      if (group[1] === 0) delete next.underline;
      else next.underline = true;
      continue;
    }

    switch (parameter) {
      case 0:
        next = {};
        break;
      case 1:
        next.bold = true;
        break;
      case 2:
        next.dim = true;
        break;
      case 3:
        next.italic = true;
        break;
      case 4:
        next.underline = true;
        break;
      case 7:
        next.inverse = true;
        break;
      case 9:
        next.strike = true;
        break;
      case 22:
        delete next.bold;
        delete next.dim;
        break;
      case 23:
        delete next.italic;
        break;
      case 24:
        delete next.underline;
        break;
      case 27:
        delete next.inverse;
        break;
      case 29:
        delete next.strike;
        break;
      case 39:
        delete next.foreground;
        break;
      case 49:
        delete next.background;
        break;
      default:
        if (parameter >= 30 && parameter <= 37)
          next.foreground = parameter - 30;
        else if (parameter >= 40 && parameter <= 47)
          next.background = parameter - 40;
        else if (parameter >= 90 && parameter <= 97)
          next.foreground = parameter - 90 + 8;
        else if (parameter >= 100 && parameter <= 107)
          next.background = parameter - 100 + 8;
        break;
    }
  }

  return next;
}

export function isPlainStyle(style) {
  for (const key in style) return false;
  return true;
}

export function sameStyle(a, b) {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;

  return keys.every((key) => {
    const left = a[key];
    const right = b[key];
    if (
      left &&
      right &&
      typeof left === "object" &&
      typeof right === "object"
    ) {
      return (
        left.red === right.red &&
        left.green === right.green &&
        left.blue === right.blue
      );
    }
    return left === right;
  });
}

// The viewport is light, so colours picked for a dark terminal need adapting.
const VIEWPORT_LUMINANCE = 0.85; // $sepia #f5ecec
const MIN_CONTRAST = 3;

function channelLuminance(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ red, green, blue }) {
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

function contrast(a, b) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function adaptForeground(rgb) {
  let { red, green, blue } = rgb;
  for (let i = 0; i < 24; i++) {
    if (
      contrast(relativeLuminance({ red, green, blue }), VIEWPORT_LUMINANCE) >=
      MIN_CONTRAST
    ) {
      break;
    }
    red = Math.round(red * 0.8);
    green = Math.round(green * 0.8);
    blue = Math.round(blue * 0.8);
  }
  return { red, green, blue };
}

export function textOnBackground(rgb) {
  return relativeLuminance(rgb) > 0.4 ? "#14161d" : "#ffffff";
}

export function rgbToCss({ red, green, blue }) {
  return `rgb(${red}, ${green}, ${blue})`;
}

export function paletteToRgb(index) {
  if (index > 231) {
    const level = 8 + (index - 232) * 10;
    return { red: level, green: level, blue: level };
  }
  const offset = index - 16;
  const channel = (value) => (value === 0 ? 0 : value * 40 + 55);
  return {
    red: channel(Math.floor(offset / 36)),
    green: channel(Math.floor(offset / 6) % 6),
    blue: channel(offset % 6),
  };
}

function toRgb(color) {
  return typeof color === "object" ? color : paletteToRgb(color);
}

// Palette colours become class names, everything else inline CSS.
export function resolveStyle(style) {
  if (!style) return { classNames: [], css: null };

  let foreground = style.foreground;
  let background = style.background;
  if (style.inverse) {
    [foreground, background] = [background, foreground];
    if (foreground === undefined) foreground = "default";
    if (background === undefined) background = "default";
  }

  const classNames = [];
  const css = {};
  let backgroundRgb = null;

  if (background !== undefined) {
    if (background === "default" || background < 16) {
      classNames.push(`ansi-bg-${background}`);
    } else {
      backgroundRgb = toRgb(background);
      css.backgroundColor = rgbToCss(backgroundRgb);
    }
  }

  if (foreground === undefined || (foreground === "default" && backgroundRgb)) {
    // `ansi-fg-default` pairs with `ansi-bg-default`, not with a colour.
    if (backgroundRgb) css.color = textOnBackground(backgroundRgb);
  } else if (foreground === "default" || foreground < 16) {
    classNames.push(`ansi-fg-${foreground}`);
  } else {
    const rgb = toRgb(foreground);
    css.color = rgbToCss(backgroundRgb ? rgb : adaptForeground(rgb));
  }

  if (style.bold) css.fontWeight = "bold";
  if (style.italic) css.fontStyle = "italic";
  if (style.dim) css.opacity = 0.7;

  const decorations = [];
  if (style.underline) decorations.push("underline");
  if (style.strike) decorations.push("line-through");
  if (decorations.length > 0) css.textDecoration = decorations.join(" ");

  return { classNames, css: Object.keys(css).length > 0 ? css : null };
}

// Attributes persist across newlines. The viewer is virtualized, so each line's
// inherited style is resolved up front.
export function parseAnsiLines(lines) {
  let style = {};

  return lines.map((line) => {
    if (!line.includes("\u001b")) {
      const text = line.replace(CONTROL_CHARACTERS, "");
      const spans =
        isPlainStyle(style) || text.length === 0
          ? []
          : [{ start: 0, end: text.length, style }];
      return { text, spans };
    }

    const spans = [];
    let text = "";
    let spanStart = 0;
    let cursor = 0;
    let match;

    // Repeated identical sequences stay one fragment.
    const closeSpan = () => {
      if (text.length <= spanStart || isPlainStyle(style)) return;
      const previous = spans[spans.length - 1];
      if (
        previous &&
        previous.end === spanStart &&
        sameStyle(previous.style, style)
      ) {
        previous.end = text.length;
      } else if (spans.length < MAX_SPANS_PER_LINE) {
        spans.push({ start: spanStart, end: text.length, style });
      }
    };

    ESCAPE_SEQUENCE.lastIndex = 0;
    while ((match = ESCAPE_SEQUENCE.exec(line)) !== null) {
      text += line.slice(cursor, match.index).replace(CONTROL_CHARACTERS, "");
      cursor = ESCAPE_SEQUENCE.lastIndex;

      if (!isSgr(match[0])) continue;

      const updated = applySgr(parseSgrGroups(match[0]), style);
      if (sameStyle(updated, style)) continue;

      closeSpan();
      style = updated;
      spanStart = text.length;
    }

    text += line.slice(cursor).replace(CONTROL_CHARACTERS, "");
    closeSpan();

    return { text, spans };
  });
}

// Split where the style changes, so highlighting and attributes compose.
export function applyStyleSpans(segments, spans) {
  if (!spans || spans.length === 0) return segments;

  const styled = [];
  let offset = 0;
  let spanIndex = 0;

  for (const segment of segments) {
    const segmentEnd = offset + segment.text.length;

    while (spanIndex < spans.length && spans[spanIndex].end <= offset) {
      spanIndex++;
    }

    let cursor = offset;
    let lookahead = spanIndex;
    while (cursor < segmentEnd) {
      while (lookahead < spans.length && spans[lookahead].end <= cursor) {
        lookahead++;
      }

      const span = spans[lookahead];
      const covers = span && span.start <= cursor;
      const next = covers
        ? Math.min(span.end, segmentEnd)
        : Math.min(span ? span.start : segmentEnd, segmentEnd);

      styled.push({
        ...segment,
        text: segment.text.slice(cursor - offset, next - offset),
        style: covers ? span.style : undefined,
      });
      cursor = next;
    }

    offset = segmentEnd;
  }

  return styled;
}
