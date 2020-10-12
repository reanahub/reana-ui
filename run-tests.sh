#!/bin/sh
#
# This file is part of REANA.
# Copyright (C) 2020 CERN.
#
# REANA is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

# Quit on errors
set -o errexit

# Quit on unbound symbols
set -o nounset

sphinx-build -qnN docs docs/_build/html
prettier reana-ui --check
cd reana-ui && yarn && yarn test --ci && cd ..
docker build -t reanahub/reana-ui .
