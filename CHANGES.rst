Changes
=======

Version 0.9.0 (UNRELEASED)
---------------------------

- Adds notification icon to the header to inform users when critical levels of quota usage is reached.
- Adds a label link to the workflow launcher URL remote origin on the workflow details page.
- Adds Launch on REANA page allowing the submission of workflows via badge-clicking.
- Adds 404 Not Found error page.
- Adds periodic refresh of the workflow details page.
- Adds new options to the workflow list page to sort workflows by most used disk and cpu quota.
- Fixes redirection chain for non-signed-in CERN SSO users to access the desired target page after sign-in.
- Fixes ``fetchWorkflow`` action to fetch a specific workflow instead of the entire user workflow list.
- Fixes the ordering by size of the files showed in the ``Workspace`` tab of the workflow-details page.
- Changes OAuth configuration to enable the new CERN SSO.
- Changes the workflow-details page to refresh after the deletion of a workflow.
- Changes the workflow-details page to show the logs of the workflow engine.
- Changes the workflow-details page to show file sizes in a human-readable format.
- Changes the workflow-details page to show the workspace's retention rules.
- Changes the deletion of a workflow to always clean up the workspace.

Version 0.8.2 (2022-02-15)
---------------------------

- Changes ``node-sass`` dependency to version 7.

Version 0.8.1 (2022-02-02)
---------------------------

- Adds support for HTML preview of workspace files.
- Adds search by name in workflow file list page.
- Adds support for Create React App v5.
- Changes cluster health status page to represent availability instead of usage.
- Changes Docker image Node version from 12 to 16.

Version 0.8.0 (2021-11-22)
---------------------------

- Adds user quota usage pie charts in Profile page.
- Adds a more generic notifications system.
- Adds a way to open, list and closes interactive sessions.
- Adds the possibility of deleting workflows to save disk space.
- Adds filtering by status and search by name in workflow list page.
- Adds import aliases.
- Adds cluster health status page.

Version 0.7.2 (2021-02-04)
--------------------------

- Adds option to require user email confirmation after sign-up.
- Adds option to display CERN Privacy Notice for CERN installations.
- Changes notification system to improve sign-in and sign-up messages.

Version 0.7.1 (2020-11-24)
---------------------------

- Fixes error handling behaviour for several server-side exceptions.

Version 0.7.0 (2020-10-20)
---------------------------

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
- Changes code formatting to respect updated ``prettier`` version coding style.
- Changes documentation to single-page layout.

Version 0.6.0 (2019-12-20)
--------------------------

- Basic login/user page using CERN SSO.
- Simple user page showing user access token.
- Adds GitLab projects integration.
- Allows enabling/disabling GitLab project integration.
- Improves UX in projects page.
- Adds state management with Redux.
- Includes SASS and CSS-modules support.
- Loads config from server and store it in Redux state.

Version 0.3.0 (2018-07-04)
--------------------------

- Initial public release.

.. admonition:: Please beware

   Please note that REANA is in an early alpha stage of its development. The
   developer preview releases are meant for early adopters and testers. Please
   don't rely on released versions for any production purposes yet.
