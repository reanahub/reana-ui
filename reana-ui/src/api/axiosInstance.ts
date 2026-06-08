/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import axios, { AxiosError } from "axios";

function isSessionExpiredError(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  const message = (
    ((error as AxiosError)?.response?.data as any)?.message || ""
  ).toLowerCase();
  return (
    status === 401 &&
    (message.includes("user not signed in") ||
      message.includes("user not logged in"))
  );
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback;
}

/**
 * Custom mutator for Orval v8 generated hooks.
 *
 * Orval v8 calls this as: customAxiosInstance(url, requestInitOptions)
 * where requestInitOptions is a standard fetch-style RequestInit object
 * (method, headers, body, etc.).
 */
export const customAxiosInstance = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const { method = "GET", headers, body, ...rest } = options ?? {};

  // Orval's URLSearchParams encodes commas as %2C. The REANA backend splits
  // comma-separated array values (e.g. status=created,running) on literal ","
  // without URL-decoding first, so %2C is not recognised as a separator.
  // Restore literal commas to match the old client.ts serialisation behaviour.
  const normalizedUrl = url.replace(/%2C/gi, ",");

  try {
    const response = await axios({
      url: normalizedUrl,
      method: method as string,
      headers: headers as Record<string, string>,
      // body in RequestInit is a string/FormData; axios uses `data`
      data: body,
      // Use page origin as baseURL so /api/... paths resolve correctly
      baseURL: typeof window !== "undefined" ? window.location.origin : "",
      withCredentials: true,
      ...rest,
    });
    return response.data as T;
  } catch (error) {
    if (onUnauthorized && isSessionExpiredError(error)) {
      onUnauthorized();
    }
    throw error;
  }
};
