/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { act, renderHook } from "@testing-library/react";

import {
  useWorkflowContinuationCue,
  workflowListContinuesBelowFooter,
} from "./useWorkflowContinuationCue";

const elementAt = (top) => ({
  getBoundingClientRect: () => ({ top }),
});

test("detects whether workflow cards continue below the footer", () => {
  expect(workflowListContinuesBelowFooter(elementAt(700), elementAt(600))).toBe(
    true,
  );
  expect(workflowListContinuesBelowFooter(elementAt(500), elementAt(600))).toBe(
    false,
  );
  expect(workflowListContinuesBelowFooter(null, elementAt(600))).toBe(false);
});

test("updates the cue on scroll, resize, loading, and result changes", () => {
  const requestAnimationFrame = jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback) => {
      callback();
      return 1;
    });
  const cancelAnimationFrame = jest
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation(() => {});
  const initialProps = {
    workflows: { first: {} },
    workflowsCount: 20,
    page: 1,
    pageSize: 10,
    loading: false,
  };
  const { result, rerender } = renderHook(
    (props) => useWorkflowContinuationCue(props),
    { initialProps },
  );

  result.current.listEndRef.current = elementAt(700);
  result.current.footerRef.current = elementAt(600);
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(result.current.showContinuationCue).toBe(true);

  result.current.listEndRef.current = elementAt(500);
  act(() => window.dispatchEvent(new Event("resize")));
  expect(result.current.showContinuationCue).toBe(false);

  result.current.listEndRef.current = elementAt(700);
  rerender({ ...initialProps, loading: true });
  expect(result.current.showContinuationCue).toBe(true);

  result.current.listEndRef.current = elementAt(500);
  rerender({
    ...initialProps,
    workflows: { second: {} },
    page: 2,
    pageSize: 20,
  });
  expect(result.current.showContinuationCue).toBe(false);

  requestAnimationFrame.mockRestore();
  cancelAnimationFrame.mockRestore();
});
