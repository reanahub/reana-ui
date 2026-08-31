/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { fireEvent, render, screen } from "@testing-library/react";

import Notification from "~/components/Notification";

describe("Notification", () => {
  it("shows a notification that only has a header", () => {
    render(<Notification header="An error has occurred" />);

    expect(
      screen.getByText("An error has occurred").closest(".transition"),
    ).toHaveClass("visible");
  });

  it("is dismissible only when an onDismiss handler is provided", () => {
    const onDismiss = jest.fn();
    const { container, rerender } = render(
      <Notification message="Something happened" />,
    );

    expect(container.querySelector(".close.icon")).not.toBeInTheDocument();

    rerender(
      <Notification message="Something happened" onDismiss={onDismiss} />,
    );
    fireEvent.click(container.querySelector(".close.icon"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
