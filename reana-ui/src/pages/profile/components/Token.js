/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useSelector } from "react-redux";

import { getConfig } from "~/selectors";
import { getDocsPageURL } from "~/util";
import { CodeSnippet } from "~/components";
import { api } from "~/config";

export default function Token() {
  const config = useSelector(getConfig);
  const installationURL = getDocsPageURL(
    config.docsURL,
    "getting-started/installation/",
  );
  return (
    <>
      Your browser session is used to authenticate REANA web requests. To use
      the command-line client, make sure you have{" "}
      {installationURL ? (
        <a href={installationURL}>reana-client installed</a>
      ) : (
        "reana-client installed"
      )}{" "}
      and run:
      <CodeSnippet copy reveal>
        <div>reana-client login --server {api}</div>
      </CodeSnippet>
    </>
  );
}
