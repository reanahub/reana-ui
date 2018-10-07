#!/bin/sh
#
# This file is part of REANA.
# Copyright (C) 2018 CERN.
#
# REANA is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

sphinx-build -qnN docs docs/_build/html
prettier reana-ui/src/**/*.js --list-different
