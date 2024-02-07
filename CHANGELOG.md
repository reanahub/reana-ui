# Changelog

## 0.9.3 (2023-12-12)

- Adds metadata labels to Dockerfile.
- Changes version of NGINX Docker image from 1.19 to 1.25.

## 0.9.2 (2023-12-06)

- Adds automated multi-platform container image building for amd64 and arm64 architectures.
- Adds option to delete all the runs of a workflow.
- Adds form to generate the launcher URL of any user-provided analysis, together with the markdown snippet for the corresponding Launch-on-REANA badge.
- Changes the Launch-on-REANA page to improve how workflow parameters are shown by displaying them inside a table.
- Changes the Launch-on-REANA page to show improved validation warnings which also indicate where unexpected properties are located in the REANA specification file.
- Changes version of Node.js Docker image from 16 to 18.
- Fixes container image building on the arm64 architecture.

## 0.9.1 (2023-09-27)

- Adds support for previewing PDF files present in a workflow's workspace.
- Adds support for previewing ROOT files present in a workflow's workspace.
- Adds support for signing-in with a custom third-party Keycloak instance.
- Adds a new menu item to the workflow actions popup to allow stopping running workflows.
- Changes the workflow deletion message to clarify that attached interactive sessions are also closed when a workflow is deleted.
- Changes the workflow progress bar to always display it as completed for finished workflows.
- Changes the interactive session notification to also report that the session will be closed after a specified number of days of inactivity.
- Changes the workflow-details page to make it possible to scroll through the list of workflow steps in the job logs section.
- Changes the workflow-details page to not automatically refresh the selected job when viewing the related logs, but keeping the user-selected one active.
- Changes the page titles to conform to the same sentence case style.
- Changes workspace file preview to support customisable maximum file size limit allowed for previewing.
- Changes nginx configuration to save bandwidth by serving gzip-compressed static files.
- Changes the launcher page to show warnings when validating the REANA specification file of the workflow to be launched.
- Changes the launcher page to allow showing custom demo examples.
- Fixes calculation of workflow runtime durations for stopped workflows.

## 0.9.0 (2023-01-19)

- Adds Launch on REANA page allowing the submission of workflows via badge-clicking.
- Adds notifications to inform users when critical levels of quota usage is reached.
- Adds 404 Not Found error page.
- Adds tab titles to all the pages.
- Changes OAuth configuration to enable the new CERN SSO.
- Changes the workflow-details page to show the logs of the workflow engine.
- Changes the workflow-details page to show file sizes in a human-readable format.
- Changes the workflow-details page to show the workspace's retention rules.
- Changes the workflow-details page to show the duration of the workflow's jobs.
- Changes the workflow-details page to display a label of the workflow launcher URL remote origin.
- Changes the workflow-details page to periodically refresh the content of the page.
- Changes the workflow-details page to refresh after the deletion of a workflow.
- Changes the workflow-list page to add a way to hide deleted workflows.
- Changes the workflow-list page to add new workflows sorting options by most used disk and cpu quota.
- Changes the deletion of a workflow to always clean up the workspace.
- Changes the announcements to support limited HTML markup.
- Fixes redirection chain for non-signed-in CERN SSO users to access the desired target page after sign-in.
- Fixes `fetchWorkflow` action to fetch a specific workflow instead of the entire user workflow list.
- Fixes the ordering by size of the files showed in the `Workspace` tab of the workflow-details page.

## 0.8.2 (2022-02-15)

- Changes `node-sass` dependency to version 7.

## 0.8.1 (2022-02-02)

- Adds support for HTML preview of workspace files.
- Adds search by name in workflow file list page.
- Adds support for Create React App v5.
- Changes cluster health status page to represent availability instead of usage.
- Changes Docker image Node version from 12 to 16.

## 0.8.0 (2021-11-22)

- Adds user quota usage pie charts in Profile page.
- Adds a more generic notifications system.
- Adds a way to open, list and closes interactive sessions.
- Adds the possibility of deleting workflows to save disk space.
- Adds filtering by status and search by name in workflow list page.
- Adds import aliases.
- Adds cluster health status page.

## 0.7.2 (2021-02-04)

- Adds option to require user email confirmation after sign-up.
- Adds option to display CERN Privacy Notice for CERN installations.
- Changes notification system to improve sign-in and sign-up messages.

## 0.7.1 (2020-11-24)

- Fixes error handling behaviour for several server-side exceptions.

## 0.7.0 (2020-10-20)

- Adds user profile page.
- Adds local user forms for sign-in and sign-up functionalities.
- Adds home page suitable for standalone vs CERN deployments.
- Adds page refresh button to workflow detailed page.
- Adds favicon to the web interface pages.
- Adds basic theme scaffolding.
- Adds announcement configuration to easily display messages on the web interface.
- Adds pagination on the workflow list and workflow detailed pages.
- Fixes loading workflow indicator.
- Fixes displaying of non-existing workflows.
- Fixes file preview functionality experience to allow/disallow certain file formats.
- Fixes workflow specification display to show runtime parameters.
- Fixes display of footer links in case they are not set during deployment.
- Changes configuration to dynamically detect URL.
- Changes main loader of the web interface.
- Changes workflow list page and all the code base to use hooks everywhere.
- Changes pre-requisites to node version 12 and latest npm dependencies.
- Changes polling to improve performance.
- Changes default font to Open Sans.
- Changes code formatting to respect updated `prettier` version coding style.
- Changes documentation to single-page layout.

## 0.6.0 (2019-12-20)

- Basic login/user page using CERN SSO.
- Simple user page showing user access token.
- Adds GitLab projects integration.
- Allows enabling/disabling GitLab project integration.
- Improves UX in projects page.
- Adds state management with Redux.
- Includes SASS and CSS-modules support.
- Loads config from server and store it in Redux state.

## 0.3.0 (2018-07-04)

- Initial public release.

