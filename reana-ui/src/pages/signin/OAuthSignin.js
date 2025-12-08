/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2022, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useQuery } from "~/hooks";
import Error from "~/components/Error";

export default function OAuthSignin() {
  const query = useQuery();
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = Object.fromEntries(query.entries());
    const code = parseInt(queryParams.code, 10);

    // Check for OAuth error response (non-2xx status code)
    if (code && (code < 200 || code >= 300)) {
      setError({
        title: queryParams.error || "Authentication Error",
        message:
          queryParams.message || "An error occurred during authentication.",
      });
      return;
    }

    const targetUrl = queryParams.next_url || "/";
    // Reload the page to fetch fresh user data with the new session cookie
    window.location.href = targetUrl;
  }, [query]);

  if (error) {
    return <Error title={error.title} message={error.message} />;
  }

  return null;
}
