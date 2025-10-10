/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2024, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Container, Dimmer, Icon, Loader, Tab } from "semantic-ui-react";

import { fetchWorkflow, fetchWorkflowLogs } from "~/actions";
import { NON_FINISHED_STATUSES } from "~/config";
import {
  getWorkflow,
  getWorkflowRefresh,
  loadingWorkflows,
  isWorkflowsFetched,
  getConfig,
} from "~/selectors";
import BasePage from "../BasePage";
import {
  InteractiveSessionModal,
  Notification,
  WorkflowInfo,
  WorkflowActionsPopup,
  WorkflowBadges,
  WorkflowDeleteModal,
  WorkflowShareModal,
  WorkflowStopModal,
} from "~/components";
import {
  WorkflowLogs,
  WorkflowFiles,
  WorkflowSpecification,
} from "./components";
import styles from "./WorkflowDetails.module.scss";

const FINISHED_STATUSES = ["finished", "failed", "stopped", "deleted"];

export default function WorkflowDetails() {
  const {
    id: workflowId,
    tab: tabFromPath = "",
    job: jobFromPath,
  } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const workflow = useSelector(getWorkflow(workflowId));
  const loading = useSelector(loadingWorkflows);
  const workflowsFetched = useSelector(isWorkflowsFetched);
  const { pollingSecs } = useSelector(getConfig);
  const interval = useRef(null);
  const workflowRefresh = useSelector(getWorkflowRefresh);

  const getPageFromUrl = () => {
    const n = parseInt(searchParams.get("page") || "", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  const page = getPageFromUrl();

  // if ?page= param is not in a valid format, or page is 1, remove page from URL
  useEffect(() => {
    const raw = searchParams.get("page");
    const n = parseInt(raw || "", 10);
    const shouldRemovePage =
      searchParams.has("page") &&
      (!raw || // page=empty string
        !Number.isFinite(n) || // page=abc
        n <= 1); // page=1, page=0

    if (shouldRemovePage) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const gotoPage = (nextPage) => {
    // Merge with existing params - keeps search, tab, etc.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage > 1) next.set("page", String(nextPage));
        else next.delete("page"); // if page 1, remove param
        return next;
      },
      { replace: false },
    );
  };

  const refetchWorkflow = useCallback(() => {
    const options = { refetch: true, showLoader: false };
    dispatch(fetchWorkflow(workflowId, options));
    dispatch(fetchWorkflowLogs(workflowId, options));
  }, [dispatch, workflowId]);

  useEffect(() => {
    if (!interval.current && pollingSecs) {
      interval.current = setInterval(refetchWorkflow, pollingSecs * 1000);
    }
    return cleanPolling;
  }, [dispatch, refetchWorkflow, workflowId, pollingSecs]);

  // FIXME: workflowRefresh is a temporary solution to refresh the workflow
  // by saving random number in redux. It should be refactored in the future
  // once websockets will be implemented
  useEffect(refetchWorkflow, [dispatch, refetchWorkflow, workflowRefresh]);

  useEffect(() => {
    if (workflow && FINISHED_STATUSES.includes(workflow.status)) {
      cleanPolling();
    }
  }, [workflow]);

  const cleanPolling = () => {
    clearInterval(interval.current);
    interval.current = null;
  };

  if (!workflowsFetched || loading) {
    return (
      <Dimmer active inverted>
        <Loader>Loading workflow...</Loader>
      </Dimmer>
    );
  }

  if (!workflow) {
    return (
      <Notification
        icon="warning sign"
        header="An error has occurred"
        message="Sorry, this workflow either does not exist or you are not authorised to see it."
        closable={false}
        error
      />
    );
  }

  const panes = [
    {
      menuItem: {
        key: "engine-logs",
        icon: "cogs",
        content: "Engine logs",
      },
      render: () => <WorkflowLogs engine workflow={workflow} />,
    },
    {
      menuItem: { key: "job-logs", icon: "terminal", content: "Job logs" },
      render: () => <WorkflowLogs workflow={workflow} />,
    },
    {
      menuItem: {
        key: "service-logs",
        icon: "cloud",
        content: "Service logs",
      },
      render: () => <WorkflowLogs service workflow={workflow} />,
    },
    {
      menuItem: {
        key: "workspace",
        icon: "folder outline",
        content: "Workspace",
      },
      render: () => (
        <WorkflowFiles
          title="Workspace"
          id={workflow.id}
          page={page}
          onPageChange={gotoPage}
        />
      ),
    },
    {
      menuItem: {
        key: "specification",
        icon: "file code outline",
        content: "Specification",
      },
      render: () => <WorkflowSpecification id={workflow.id} />,
    },
  ];

  // If the workflow has finished, and it did not fail, then engine logs are shown.
  // Otherwise, job logs are displayed.
  const hasFinished = FINISHED_STATUSES.includes(workflow.status);
  let defaultActiveIndex = 1; // job logs
  if (hasFinished && workflow.status !== "failed") {
    defaultActiveIndex = 0; // engine logs
  }

  // If URL has a /:tab value, use it to find the index
  const tabKeys = panes.map((p) => p.menuItem.key);
  const activeTabIndex = tabFromPath
    ? Math.max(tabKeys.indexOf(tabFromPath), 0)
    : defaultActiveIndex;

  const pageTitle = `${workflow.name} #${workflow.run}`;

  return (
    <BasePage title={pageTitle}>
      <Container className={styles["workflow-details-container"]}>
        <div className={styles["workflow-info"]}>
          <WorkflowInfo workflow={workflow} />
          <div className={styles.actions}>
            {NON_FINISHED_STATUSES.includes(workflow.status) && (
              <Icon
                link
                name="refresh"
                className={styles.refresh}
                onClick={() => window.location.reload()}
              />
            )}
            <WorkflowActionsPopup workflow={workflow} />
          </div>
        </div>
        <div className={styles.badges}>
          <WorkflowBadges className={styles.badges} workflow={workflow} />
        </div>
        <Tab
          menu={{ secondary: true, pointing: true }}
          panes={panes}
          activeIndex={activeTabIndex}
          onTabChange={(_, data) => {
            const nextKey = tabKeys[data.activeIndex];
            // Preserve query params only if needed (page and search are only meaningful for workspace)
            const keepQuery =
              nextKey === "workspace"
                ? (() => {
                    const q = new URLSearchParams(searchParams);
                    return q.toString() ? `?${q.toString()}` : "";
                  })()
                : "";

            // Build new path, for job-logs, preserve current :job path segment if present.
            const base = `/workflows/${workflowId}`;
            const path =
              nextKey === "job-logs"
                ? `${base}/job-logs${jobFromPath ? `/${jobFromPath}` : ""}`
                : `${base}/${nextKey}`;

            navigate(`${path}${keepQuery}`, { replace: false });
          }}
        />
        <InteractiveSessionModal />
        <WorkflowDeleteModal />
        <WorkflowStopModal />
        <WorkflowShareModal />
      </Container>
    </BasePage>
  );
}
