/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore } from "redux";

import { triggerNotification } from "~/actions";
import GlobalNotification from "~/components/GlobalNotification";
import reducer from "~/reducers";

const AUTO_CLOSE_TIMEOUT = 16000;

function renderGlobalNotification(action) {
  const store = createStore(reducer);
  if (action) store.dispatch(action);
  const view = render(
    <Provider store={store}>
      <GlobalNotification />
    </Provider>,
  );
  return { store, ...view };
}

describe("GlobalNotification", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders a notification from Redux and dismisses it from the close control", () => {
    const { container, store } = renderGlobalNotification(
      triggerNotification("Success!", "Workflow created."),
    );

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Workflow created.")).toBeInTheDocument();

    fireEvent.click(container.querySelector(".close.icon"));

    expect(store.getState().notification).toBeNull();
  });

  it("automatically dismisses a notification after 16 seconds", () => {
    const { store } = renderGlobalNotification(
      triggerNotification("Success!", "Workflow created."),
    );

    act(() => jest.advanceTimersByTime(AUTO_CLOSE_TIMEOUT - 1));
    expect(store.getState().notification).not.toBeNull();

    act(() => jest.advanceTimersByTime(1));
    expect(store.getState().notification).toBeNull();
  });

  it("restarts the timeout when another notification arrives", () => {
    const { store } = renderGlobalNotification(
      triggerNotification("First", "First message"),
    );

    act(() => jest.advanceTimersByTime(AUTO_CLOSE_TIMEOUT / 2));
    act(() => {
      store.dispatch(triggerNotification("Second", "Second message"));
    });
    act(() => jest.advanceTimersByTime(AUTO_CLOSE_TIMEOUT / 2));

    expect(store.getState().notification.header).toBe("Second");

    act(() => jest.advanceTimersByTime(AUTO_CLOSE_TIMEOUT / 2));
    expect(store.getState().notification).toBeNull();
  });

  it("renders a header-only Redux notification", () => {
    renderGlobalNotification(triggerNotification("An error has occurred"));

    expect(
      screen.getByText("An error has occurred").closest(".transition"),
    ).toHaveClass("visible");
  });

  test.each([
    ["error", { error: true }, "error", "warning sign"],
    ["warning", { warning: true }, "warning", "warning circle"],
  ])("renders the %s variant and icon", (_, options, variant, icon) => {
    const { container } = renderGlobalNotification(
      triggerNotification("Notice", "Message", options),
    );

    expect(container.querySelector(".ui.message")).toHaveClass(variant);
    expect(
      container.querySelector(`i.${icon.replace(" ", ".")}.icon`),
    ).toBeInTheDocument();
  });
});
