import styles from "./WorkflowBadges.module.scss";
import PropTypes from "prop-types";
import { Label } from "semantic-ui-react";
import { JupyterNotebookIcon } from "~/components";
import { INTERACTIVE_SESSION_URL } from "~/client";
import { LauncherLabel } from "~/components";
import { getReanaToken } from "~/selectors";
import { useSelector } from "react-redux";
import { statusMapping } from "~/util";

export default function WorkflowBadges({ workflow, badgeSize = "tiny" }) {
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
            size={badgeSize}
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
            size={badgeSize}
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
            size={badgeSize}
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
    </>
  );
}

WorkflowBadges.propTypes = {
  workflow: PropTypes.object.isRequired,
  badgeSize: PropTypes.string,
};
