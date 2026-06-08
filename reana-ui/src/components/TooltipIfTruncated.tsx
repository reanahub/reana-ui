/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { Children, cloneElement } from "react";

interface Props {
  children: React.ReactElement;
  tooltip?: string | null;
}

export default function TooltipIfTruncated({
  children,
  tooltip = null,
}: Props) {
  function mouseEnter(event: React.MouseEvent<HTMLElement>) {
    const element = event.target as HTMLElement;
    const overflows =
      element.offsetWidth < element.scrollWidth ||
      element.offsetHeight < element.scrollHeight;

    if (overflows && !element.getAttribute("title")) {
      element.setAttribute("title", tooltip || element.innerText);
    }
  }

  const child = Children.only(children);
  return cloneElement(child, {
    onMouseEnter: (event) => mouseEnter(event),
  });
}
