/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2021 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { PieChart as ReactMinimalPieChart } from "react-minimal-pie-chart";

const SEPIA_COLOR = "#f5ecec";
const DARK_SEPIA_COLOR = "#b68181";

interface PieChartDataItem {
  title: string;
  value: number;
  color: string;
}

interface Props {
  title?: string | null;
  data?: PieChartDataItem[] | null;
  value?: number;
  totalValue?: number | null;
  fillColor?: string;
  backgroundColor?: string;
}

export default function PieChart({
  title = null,
  data = null,
  value = 0,
  totalValue = null,
  fillColor = DARK_SEPIA_COLOR,
  backgroundColor = SEPIA_COLOR,
}: Props) {
  return (
    <ReactMinimalPieChart
      data={
        data || [
          {
            title: title,
            value: value,
            color: fillColor,
          },
        ]
      }
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
