import styles from "./WorkflowBadges.module.scss";
import { Label } from "semantic-ui-react";
import { JupyterNotebookIcon } from "~/components";
import { INTERACTIVE_SESSION_URL } from "~/client";
import { LauncherLabel } from "~/components";
import { getReanaToken } from "~/selectors";
import { useSelector } from "react-redux";
import { statusMapping } from "~/util";

export default function WorkflowBadges({ workflow }) {
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
      <div className={styles.badgesContainer}>
        {workflow.duration && (
          <Label
            size="tiny"
            content={workflow.duration}
            icon="clock"
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
            content={"Notebook"}
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
    </>
  );
}
