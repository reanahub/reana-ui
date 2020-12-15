/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";

export function useSubmit(action) {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleSubmit = (event, formData, setFormData) => {
    const { from } = location.state || { from: { pathname: "/" } };
    dispatch(action(formData)).then((res) => {
      if (res.isAxiosError ?? false) {
        setFormData({ ...formData, password: "" });
      } else {
        history.replace(from);
      }
    });
    event.preventDefault();
  };

  return handleSubmit;
}
