/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/
import { formatBytes, formatDuration } from "./util";

test("display friendly durations", () => {
  expect(formatDuration(0)).toBe("0s");
  expect(formatDuration(1000 * 35)).toBe("35s");
  expect(formatDuration(1000 * 60 * 7 + 1000 * 40)).toBe("7m 40s");
  expect(formatDuration(1000 * 60 * 60 * 2)).toBe("2h");
  expect(formatDuration(1000 * 60 * 60 * 2 + 1000 * 60 * 20)).toBe("2h 20m");
  expect(formatDuration(1000 * 60 * 60 * 2 + 1000 * 60 * 35 + 1000 * 10)).toBe(
    "2h 35m 10s"
  );
});

test("display friendly digital information units", () => {
  expect(formatBytes(0)).toBe("0 Bytes");
  expect(formatBytes(1024 * 35)).toBe("35 KB");
  expect(formatBytes(1024 * 200 + 512)).toBe("200.5 KB");
  expect(formatBytes(1024 ** 2)).toBe("1 MB");
  expect(formatBytes(1024 ** 2 + 1024 * 768)).toBe("1.75 MB");
  expect(formatBytes(1024 ** 3 * 5 + 1024 ** 2 * 100)).toBe("5.1 GB");
  expect(formatBytes(1024 ** 4 + 1024 ** 3 * 256)).toBe("1.25 TB");
});
