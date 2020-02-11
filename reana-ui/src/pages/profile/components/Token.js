/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { useSelector } from "react-redux";

import { getReanaToken } from "../../../selectors";
import CodeSnippet from "../../../components/CodeSnippet";
import config from "../../../config";

export default function Token() {
  const reanaToken = useSelector(getReanaToken);

  return (
    <>
      In order to use your token, make sure you have reana-client installed and
      run:
      <CodeSnippet copy>
        <div>export REANA_SERVER_URL={config.api}</div>
        <div>export REANA_ACCESS_TOKEN={reanaToken}</div>
      </CodeSnippet>
    </>
  );
}
