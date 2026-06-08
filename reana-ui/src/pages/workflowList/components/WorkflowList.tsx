/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Loader, Message, Divider } from "semantic-ui-react";
import { Link } from "react-router-dom";

import {
  Box,
  WorkflowBadges,
  WorkflowInfo,
  WorkflowActionsPopup,
} from "~/components";
import { useGetYou } from "~/api/hooks";
import { ParsedWorkflow } from "~/util";

import styles from "./WorkflowList.module.scss";

interface WorkflowListItemProps {
  workflow: ParsedWorkflow;
}

function WorkflowListItem({ workflow }: WorkflowListItemProps) {
  const userEmail = useGetYou().data?.email ?? "";
  const isOwner = workflow.ownerEmail === userEmail;
  const sharedWith = workflow.sharedWith ?? [];

  let sharingClass = "";
  if (!isOwner) {
    sharingClass = styles["shared-with-me"];
  } else if (sharedWith.length > 0) {
    sharingClass = styles["i-shared"];
  }

  const cardClass = [
    workflow.status === "deleted" ? styles.deleted : "",
    sharingClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box className={cardClass} padding={false} flex={false}>
      <Link to={`/workflows/${workflow.id}`}>
        <div className={styles["workflow-details-container"]}>
          <WorkflowInfo workflow={workflow} actionsOnHover={true} />
        </div>
      </Link>
      <Divider className={styles.divider}></Divider>
      <div className={styles["badges-and-actions"]}>
        <WorkflowBadges workflow={workflow} />
        <WorkflowActionsPopup workflow={workflow} />
      </div>
    </Box>
  );
}

interface WorkflowListProps {
  workflows: ParsedWorkflow[];
  loading: boolean;
}

export default function WorkflowList({
  workflows,
  loading,
}: WorkflowListProps) {
  if (loading) return <Loader active />;
  if (!workflows.length) {
    return <Message info icon="info circle" content="No workflows found." />;
  }
  return (
    <>
      {workflows.map((workflow) => (
        <WorkflowListItem key={workflow.id} workflow={workflow} />
      ))}
    </>
  );
}
