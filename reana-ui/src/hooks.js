/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

export function useSubmit(action) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (event, formData, setFormData) => {
    const { from } = location.state || { from: { pathname: "/" } };
    dispatch(action(formData)).then((res) => {
      if (res.isAxiosError ?? false) {
        setFormData({ ...formData, password: "" });
      } else {
        navigate(from, { replace: true });
      }
    });
    event.preventDefault();
  };

  return handleSubmit;
}

/**
 * React Hook to retrieve the current query string params.
 * @returns URLSearchParams object
 */
export function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

/**
 * React Hook to update the document title.
 */
export function useDocumentTitle(title = "") {
  useEffect(() => {
    document.title = (title ? `${title} - ` : "") + window.location.hostname;
  }, [title]);
}
