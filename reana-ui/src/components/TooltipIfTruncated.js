/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import PropTypes from "prop-types";

export default function TooltipIfTruncated({ children, tooltip }) {
  function mouseEnter(event) {
    const element = event.target;
    const overflows =
      element.offsetWidth < element.scrollWidth ||
      element.offsetHeight < element.scrollHeight;

    if (overflows && !element.getAttribute("title")) {
      element.setAttribute("title", tooltip || element.innerText);
    }
  }

  const child = React.Children.only(children);
  return React.cloneElement(child, {
    onMouseEnter: (event) => mouseEnter(event),
  });
}

TooltipIfTruncated.propTypes = {
  children: PropTypes.any.isRequired,
  tooltip: PropTypes.string,
};

TooltipIfTruncated.defaultProps = {
  tooltip: null,
};
