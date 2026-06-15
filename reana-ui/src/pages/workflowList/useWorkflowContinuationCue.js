/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useRef, useState } from "react";

export const workflowListContinuesBelowFooter = (listEnd, footer) =>
  Boolean(
    listEnd &&
    footer &&
    listEnd.getBoundingClientRect().top > footer.getBoundingClientRect().top,
  );

export function useWorkflowContinuationCue({
  workflows,
  workflowsCount,
  page,
  pageSize,
  loading,
}) {
  const listEndRef = useRef(null);
  const footerRef = useRef(null);
  const frameRef = useRef();
  const [showContinuationCue, setShowContinuationCue] = useState(false);

  const scheduleUpdate = useCallback(() => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() =>
      setShowContinuationCue(
        workflowListContinuesBelowFooter(listEndRef.current, footerRef.current),
      ),
    );
  }, []);

  // Subscriptions are installed once; remeasuring on result changes is a
  // separate concern below.
  useEffect(() => {
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [scheduleUpdate]);

  useEffect(() => {
    scheduleUpdate();
  }, [scheduleUpdate, workflows, workflowsCount, page, pageSize, loading]);

  return { listEndRef, footerRef, showContinuationCue };
}
