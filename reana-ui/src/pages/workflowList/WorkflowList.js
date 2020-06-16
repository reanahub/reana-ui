/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dimmer, Loader } from "semantic-ui-react";

import { fetchWorkflows } from "../../actions";
import { getWorkflows, loadingWorkflows } from "../../selectors";
import config from "../../config";
import BasePage from "../BasePage";
import Welcome from "./components/Welcome";
import WorkflowList from "./components/WorkflowList";

export default function WorkflowListPage() {
  return (
    <BasePage>
      <Workflows />
    </BasePage>
  );
}

function Workflows() {
  const currentUTCTime = () => moment.utc().format("HH:mm:ss [UTC]");
  const [refreshedAt, setRefreshedAt] = useState(currentUTCTime());
  const dispatch = useDispatch();
  const workflows = useSelector(getWorkflows);
  const loading = useSelector(loadingWorkflows);
  const interval = useRef(null);

  useEffect(() => {
    dispatch(fetchWorkflows());

    if (!interval.current) {
      interval.current = setInterval(() => {
        dispatch(fetchWorkflows());
        setRefreshedAt(currentUTCTime());
      }, config.poolingSecs * 1000);
    }

    return function cleanup() {
      clearInterval(interval.current);
    };
  }, [dispatch]);

  if (!workflows) {
    return (
      loading && (
        <Dimmer active inverted>
          <Loader>Loading workflows...</Loader>
        </Dimmer>
      )
    );
  } else if (_.isEmpty(workflows)) {
    return <Welcome />;
  } else {
    const workflowArray = Object.entries(workflows).map(
      ([_, workflow]) => workflow
    );
    return <WorkflowList workflows={workflowArray} refreshedAt={refreshedAt} />;
  }
}
