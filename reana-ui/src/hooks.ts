/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Hook to retrieve the current query string params.
 * @returns URLSearchParams object
 */
export function useQuery(): URLSearchParams {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * React Hook to update the document title.
 */
export function useDocumentTitle(title: string = ""): void {
  useEffect(() => {
    document.title = (title ? `${title} - ` : "") + window.location.hostname;
  }, [title]);
}
