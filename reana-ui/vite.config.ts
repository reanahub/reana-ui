/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const REANA_SERVER_URL = process.env.REANA_SERVER_URL?.replace(
  "localhost",
  "127.0.0.1",
);

const proxyTarget = {
  target: REANA_SERVER_URL,
  secure: false,
  ws: true,
};

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      // Explicit .scss extension so the sass importer resolves it correctly
      "@palette": path.resolve(__dirname, "./src/styles/palette.scss"),
    },
  },

  server: {
    proxy: {
      "/api": proxyTarget,
      // Matches Jupyter notebook session URLs: /<uuid>/...
      "^/[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+/": proxyTarget,
    },
  },

  build: {
    outDir: "dist",
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
  },
});
