/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import { confirmUserEmail } from "../../actions";

export default function Confirm() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(confirmUserEmail(token)).then(() => history.replace("/"));
  }, [dispatch, token, history]);

  return null;
}
