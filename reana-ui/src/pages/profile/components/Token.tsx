/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useGetYou } from "~/api/hooks";
import { CodeSnippet } from "~/components";
import { WelcomeNoTokenMsg } from "~/pages/workflowList/components/Welcome";
import { api } from "~/config";

export default function Token() {
  const { data: youData } = useGetYou();
  const reanaToken = youData?.reana_token?.value ?? null;

  return reanaToken ? (
    <>
      In order to use your token, make sure you have reana-client installed and
      run:
      <CodeSnippet copy reveal>
        <div>export REANA_SERVER_URL={api}</div>
        <div>
          export REANA_ACCESS_TOKEN=
          <span className="revealable">{reanaToken}</span>
        </div>
      </CodeSnippet>
    </>
  ) : (
    <WelcomeNoTokenMsg />
  );
}
