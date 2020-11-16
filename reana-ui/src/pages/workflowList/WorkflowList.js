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
import {
  getConfig,
  getReanaToken,
  getWorkflows,
  getWorkflowsCount,
  isConfigLoaded,
  loadingWorkflows,
} from "../../selectors";
import BasePage from "../BasePage";
import Welcome from "./components/Welcome";
import WorkflowList from "./components/WorkflowList";
import { Pagination } from "../../components";

import styles from "./WorkflowList.module.scss";

const PAGE_SIZE = 5;

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
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE });
  const dispatch = useDispatch();
  const config = useSelector(getConfig);
  const workflows = useSelector(getWorkflows);
  const workflowsCount = useSelector(getWorkflowsCount);
  const loading = useSelector(loadingWorkflows);
  const reanaToken = useSelector(getReanaToken);
  const configLoaded = useSelector(isConfigLoaded);
  const interval = useRef(null);
  const hideWelcomePage = !workflows || !configLoaded;

  useEffect(() => {
    dispatch(fetchWorkflows({ ...pagination }));

    if (!interval.current && reanaToken && config.pollingSecs) {
      interval.current = setInterval(() => {
        dispatch(fetchWorkflows({ ...pagination }));
        setRefreshedAt(currentUTCTime());
      }, config.pollingSecs * 1000);
    }

    return function cleanup() {
      clearInterval(interval.current);
    };
  }, [config.pollingSecs, dispatch, pagination, reanaToken]);

  if (hideWelcomePage) {
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
    return (
      <div className={styles.container}>
        <WorkflowList workflows={workflowArray} refreshedAt={refreshedAt} />
        {workflowsCount > PAGE_SIZE && (
          <Pagination
            className={styles.pagination}
            defaultActivePage={1}
            totalPages={Math.ceil(workflowsCount / PAGE_SIZE)}
            onPageChange={(_, { activePage }) => {
              clearInterval(interval.current);
              interval.current = null;
              setPagination({ ...pagination, page: activePage });
            }}
          />
        )}
      </div>
    );
  }
}
