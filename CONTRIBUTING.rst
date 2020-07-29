Contributing
============

Bug reports, issues, feature requests, and other contributions are welcome. If you find
a demonstrable problem that is caused by the REANA code, please:

1. Search for `already reported problems
   <https://github.com/reanahub/reana-ui/issues>`_.
2. Check if the issue has been fixed or is still reproducible on the
   latest `master` branch.
3. Create an issue, ideally with **a test case**.

If you create a pull request fixing a bug or implementing a feature, you can run
the tests to ensure that everything is operating correctly:

.. code-block:: console

    $ ./run-tests.sh

Each pull request should preserve or increase code coverage.


We are using Prettier to format our code. In order to use it before a pull request:

1. Install the package from NPM

   .. code-block:: console

      $ npm install prettier


2. Style your code

   .. code-block:: console

      $ prettier --write **/*.js
