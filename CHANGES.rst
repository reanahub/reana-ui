Changes
=======

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
