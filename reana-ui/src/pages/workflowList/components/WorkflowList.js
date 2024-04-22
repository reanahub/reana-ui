/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2021, 2022, 2023, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Loader, Message, Divider } from "semantic-ui-react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import {
  Box,
  WorkflowBadges,
  WorkflowInfo,
  WorkflowDeleteModal,
  WorkflowStopModal,
  WorkflowActionsPopup,
  InteractiveSessionModal,
} from "~/components";

import styles from "./WorkflowList.module.scss";

export default function WorkflowList({ workflows, loading }) {
  if (loading) return <Loader active />;
  if (!workflows.length) {
    return <Message info icon="info circle" content="No workflows found." />;
  }
  return (
    <>
      {workflows.map((workflow) => {
        return (
          <Box
            className={workflow.status === "deleted" ? styles.deleted : ""}
            key={workflow.id}
            padding={false}
            flex={false}
          >
            <Link key={workflow.id} to={`/details/${workflow.id}`}>
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
      })}
      <InteractiveSessionModal />
      <WorkflowDeleteModal />
      <WorkflowStopModal />
    </>
  );
}

WorkflowList.propTypes = {
  workflows: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
};
