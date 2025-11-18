/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect } from "react";
import { useQuery } from "~/hooks";

export default function OAuthSignin() {
  const query = useQuery();

  useEffect(() => {
    const queryParams = Object.fromEntries(query.entries());
    const targetUrl = queryParams.next_url || "/";
    // Reload the page to fetch fresh user data with the new session cookie
    window.location.href = targetUrl;
  }, [query]);

  return null;
}
