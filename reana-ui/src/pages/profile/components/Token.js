/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { CodeSnippet } from "~/components";
import { api } from "~/config";

export default function Token() {
  return (
    <>
      Your browser session is used to authenticate REANA web requests. To use
      the command-line client, make sure you have reana-client installed and
      run:
      <CodeSnippet copy reveal>
        <div>export REANA_SERVER_URL={api}</div>
        <div>reana-client login</div>
      </CodeSnippet>
    </>
  );
}
