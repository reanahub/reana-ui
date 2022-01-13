########
REANA-UI
########

.. image:: https://github.com/reanahub/reana-ui/workflows/CI/badge.svg
   :target: https://github.com/reanahub/reana-ui/actions

.. image:: https://readthedocs.org/projects/reana-ui/badge/?version=latest
   :target: https://reana-ui.readthedocs.io/en/latest/?badge=latest

.. image:: https://badges.gitter.im/Join%20Chat.svg
   :target: https://gitter.im/reanahub/reana?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge

.. image:: https://img.shields.io/github/license/reanahub/reana-ui.svg
   :target: https://github.com/reanahub/reana-ui/blob/master/LICENSE

.. image:: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
   :target: https://github.com/prettier/prettier

About
=====

REANA-UI is a component of the `REANA <http://www.reana.io/>`_ reusable and
reproducible research data analysis platform. REANA-UI provides a web interface
to review production and historical workflows.

Features
========

- Profile page containing REANA access token
- List of personal workflows
- Workflow details page containing logs, files, specification
- GitLab integration to load your workflow repositories

Usage
=====

The detailed information on how to install and use REANA can be found in
`docs.reana.io <https://docs.reana.io>`_.

Development
===========

.. code-block:: console

   $ git clone https://github.com/reanahub/reana-ui.git
   $ cd reana-ui/reana-ui
   $ yarn install
   $ yarn start # make sure REANA_SERVER_URL env var is set
   $ firefox localhost:3000

Useful links
============

- `REANA project home page <https://www.reana.io/>`_
- `REANA user documentation <https://docs.reana.io>`_
- `REANA user support forum <https://forum.reana.io>`_

- `REANA-UI releases <https://reana-ui.readthedocs.io/en/latest#changes>`_
- `REANA-UI docker images <https://hub.docker.com/r/reanahub/reana-ui>`_
- `REANA-UI developer documentation <https://reana-ui.readthedocs.io/>`_
- `REANA-UI known issues <https://github.com/reanahub/reana-ui/issues>`_
- `REANA-UI source code <https://github.com/reanahub/reana-ui>`_
