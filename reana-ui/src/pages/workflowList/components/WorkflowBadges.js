import styles from "~/pages/workflowList/components/WorkflowBadges.module.scss";
import { Divider, Label } from "semantic-ui-react";
import { JupyterNotebookIcon, WorkflowActionsPopup } from "~/components";
import { INTERACTIVE_SESSION_URL } from "~/client";
import { LauncherLabel } from "~/pages/workflowDetails/components";
import { getReanaToken } from "~/selectors";
import { useSelector } from "react-redux";
import { statusMapping } from "~/util";

export default function WorkflowBadges({ workflow, withDivider = true }) {
  const reanaToken = useSelector(getReanaToken);
  const {
    id,
    size,
    launcherURL,
    session_uri: sessionUri,
    session_status: sessionStatus,
  } = workflow;
  const hasDiskUsage = size.raw > 0;
  const isSessionOpen = sessionStatus === "created";

  return (
    <>
      <Divider className={styles.divider}></Divider>
      <div className={styles["badges-and-actions"]}>
        <div className={styles.badgesContainer}>
          {workflow.duration && (
            <Label
              size="tiny"
              content={workflow.duration}
              icon="clock"
              as="a"
              href={"/details/" + id}
              target="_blank"
              rel="noopener noreferrer"
              color={statusMapping[workflow.status].color}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {hasDiskUsage && (
            <Label
              size="tiny"
              content={size.human_readable}
              icon="hdd"
              as="a"
              href={"/details/" + id}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {isSessionOpen && (
            <Label
              size="tiny"
              content={" Notebook"}
              icon={<JupyterNotebookIcon size={12} />}
              as="a"
              href={INTERACTIVE_SESSION_URL(sessionUri, reanaToken)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <LauncherLabel url={launcherURL} />
        </div>
        <div className={styles.actionsContainer}>
          <WorkflowActionsPopup
            workflow={workflow}
            className={`${styles.actions} ${styles["always-visible"]}`}
          />
        </div>
      </div>
    </>
  );
}
