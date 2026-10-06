/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

/* global JSROOT */

(function () {
  // Messages are only exchanged with REANA-UI, which is served from the same
  // URL origin as this page. `self.origin` is "null" inside the sandbox, but
  // `location.origin` still describes the URL this page was served from.
  const uiOrigin = window.location.origin;

  // Accessing cookies or web storage throws in an opaque origin, and jsroot
  // keeps its settings there (cookies in 7.5, web storage in later versions).
  // Replace them with an empty cookie jar and storage kept in memory.
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => "",
    set: () => {},
  });

  function createMemoryStorage() {
    const items = new Map();
    return {
      get length() {
        return items.size;
      },
      key: (index) => [...items.keys()][index] ?? null,
      getItem: (key) => items.get(String(key)) ?? null,
      setItem: (key, value) => items.set(String(key), String(value)),
      removeItem: (key) => items.delete(String(key)),
      clear: () => items.clear(),
    };
  }

  for (const name of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(window, name, {
      configurable: true,
      value: createMemoryStorage(),
    });
  }

  let gui = null;

  function showError(message) {
    const container = document.getElementById("root-browser");
    container.textContent = message;
  }

  function openFile(buffer) {
    if (!gui) {
      gui = JSROOT.buildGUI("root-browser");
    }
    gui
      .then((rootGUI) => rootGUI.openRootFile(buffer))
      .catch((error) => showError(`Cannot display the ROOT file: ${error}`));
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== uiOrigin) {
      return;
    }
    if (event.data?.type === "reana-root-viewer:open") {
      openFile(event.data.buffer);
    }
  });

  window.addEventListener("load", () => {
    window.parent.postMessage({ type: "reana-root-viewer:ready" }, uiOrigin);
  });
})();
