/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { PieChart as ReactMinimalPieChart } from "react-minimal-pie-chart";

const SEPIA_COLOR = "#f5ecec";
const DARK_SEPIA_COLOR = "#b68181";

export default function PieChart({
  title,
  value,
  totalValue,
  fillColor,
  backgroundColor,
}) {
  return (
    <ReactMinimalPieChart
      data={[
        {
          title: title,
          value: value,
          color: fillColor,
        },
      ]}
      lineWidth={30}
      background={backgroundColor}
      totalValue={totalValue}
      startAngle={270}
      style={{ height: "150px", flexBasis: "200px" }}
      label={() => title}
      labelStyle={{
        fontSize: "14px",
        fill: fillColor,
      }}
      labelPosition={0}
    />
  );
}

PieChart.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number,
  totalValue: PropTypes.number.isRequired,
  fillColor: PropTypes.string,
  backgroundColor: PropTypes.string,
};

PieChart.defaultProps = {
  title: null,
  value: 0,
  fillColor: DARK_SEPIA_COLOR,
  backgroundColor: SEPIA_COLOR,
};
