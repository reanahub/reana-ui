/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022, 2023, 2024, 2025 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Container, Dimmer, Icon, Loader, Tab } from "semantic-ui-react";
import {
  useGetWorkflows,
  useGetConfig,
  useGetWorkflowSpecification,
  useInfo,
  WorkflowsParams,
} from "~/api/hooks";
import { NON_FINISHED_STATUSES } from "~/config";
import { parseWorkflows, ParsedWorkflow } from "~/util";
import BasePage from "../BasePage";
import {
  Notification,
  WorkflowInfo,
  WorkflowActionsPopup,
  WorkflowBadges,
} from "~/components";
import {
  WorkflowLogs,
  WorkflowFiles,
  WorkflowSpecification,
} from "./components";
import styles from "./WorkflowDetails.module.scss";

const FINISHED_STATUSES = ["finished", "failed", "stopped", "deleted"];

export function getWorkflowDetailsParams(
  workflowId: string | undefined,
): WorkflowsParams {
  return {
    workflow_id_or_name: workflowId,
    verbose: true,
    page: 1,
    size: 1,
    shared: true,
  };
}

export default function WorkflowDetails() {
  const {
    id: workflowId,
    tab: tabFromPath = "",
    job: jobFromPath,
  } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const pollingSecs = Number(useGetConfig().data?.polling_secs) || 0;

  const params = getWorkflowDetailsParams(workflowId);
  const { data: workflowsData, isLoading: loading } = useGetWorkflows(params, {
    query: {
      refetchInterval: (query) => {
        const items = (query.state.data as any)?.items;
        if (!items?.length) return false;
        const status = items[0]?.status;
        const nonFinished = ["running", "queued", "pending", "created"];
        return nonFinished.includes(status) ? (pollingSecs ?? 0) * 1000 : false;
      },
    },
  });
  const workflow: ParsedWorkflow | undefined = useMemo(() => {
    const items = (workflowsData?.items ?? []) as any[];
    return items.length
      ? (Object.values(parseWorkflows(items))[0] as ParsedWorkflow)
      : undefined;
  }, [workflowsData]);
  const workflowsFetched = workflowsData !== undefined;

  const infoData = useInfo({ access_token: "" }).data;
  const [daskEnabled, setDaskEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    if (infoData === undefined) return;
    const raw = infoData?.dask_enabled?.value;
    setDaskEnabled(raw?.toLowerCase() === "true");
  }, [infoData]);

  const workflowSpec = useGetWorkflowSpecification(workflowId!).data;

  const workflowUsesDask = useMemo(() => {
    if (!daskEnabled) return false;
    return Boolean(
      (workflowSpec?.specification?.workflow as any)?.resources?.dask,
    );
  }, [daskEnabled, workflowSpec]);

  const getPageFromUrl = (): number => {
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

  const gotoPage = (nextPage: number): void => {
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
    ...(workflowUsesDask
      ? [
          {
            menuItem: {
              key: "service-logs",
              icon: "cloud",
              content: "Service logs",
            },
            render: () => <WorkflowLogs service workflow={workflow} />,
          },
        ]
      : []),
    {
      menuItem: { key: "job-logs", icon: "terminal", content: "Job logs" },
      render: () => <WorkflowLogs workflow={workflow} />,
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
  const tabKeys = panes.map((p) => p.menuItem.key);
  let defaultActiveIndex = tabKeys.indexOf("job-logs");
  if (hasFinished && workflow.status !== "failed") {
    defaultActiveIndex = tabKeys.indexOf("engine-logs");
  }

  // If URL has a /:tab value, use it to find the index
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
            {NON_FINISHED_STATUSES.includes(workflow.status as any) && (
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
          onTabChange={(_: any, data: any) => {
            const nextKey = tabKeys[data.activeIndex];
            // Preserve query params only for workspace; strip file-preview params when leaving it.
            const keepQuery = (() => {
              if (nextKey !== "workspace") return "";
              const q = new URLSearchParams(searchParams);
              // Don't carry file preview state when re-entering workspace from another tab
              q.delete("name");
              q.delete("version");
              return q.toString() ? `?${q.toString()}` : "";
            })();

            // Build new path, for job-logs, preserve current :job path segment if present.
            const base = `/workflows/${workflowId}`;
            const path =
              nextKey === "job-logs"
                ? `${base}/job-logs${jobFromPath ? `/${jobFromPath}` : ""}`
                : `${base}/${nextKey}`;

            navigate(`${path}${keepQuery}`, { replace: false });
          }}
        />
      </Container>
    </BasePage>
  );
}
