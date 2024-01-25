#!/usr/bin/env bash
#
# This file is part of REANA.
# Copyright (C) 2018, 2019, 2020, 2021, 2022, 2023, 2024 CERN.
#
# REANA is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.

set -o errexit
set -o nounset

check_commitlint () {
    from=${2:-master}
    to=${3:-HEAD}
    npx commitlint --from="$from" --to="$to"
    found=0
    while IFS= read -r line; do
        if echo "$line" | grep -qP "\(\#[0-9]+\)$"; then
            true
        else
            echo "✖   PR number missing in $line"
            found=1
        fi
    done < <(git log "$from..$to" --format="%s")
    if [ $found -gt 0 ]; then
        exit 1
    fi
}

check_shellcheck () {
    find . -name "*.sh" -exec shellcheck {} \+
}

check_sphinx () {
    sphinx-build -qnNW docs docs/_build/html
}

check_lint () {
    (cd reana-ui && yarn && yarn lint)
}

check_prettier () {
    (cd reana-ui && yarn && yarn prettier)
}

check_js_tests () {
    (cd reana-ui && yarn && yarn test --ci --passWithNoTests)
}

check_dockerfile () {
    docker run -i --rm docker.io/hadolint/hadolint:v2.12.0 < Dockerfile
}

check_docker_build () {
    docker build -t docker.io/reanahub/reana-ui .
}

check_all () {
    check_commitlint
    check_shellcheck
    check_sphinx
    check_lint
    check_prettier
    check_js_tests
    check_dockerfile
    check_docker_build
}

if [ $# -eq 0 ]; then
    check_all
    exit 0
fi

for arg in "$@"
do
    case $arg in
        --check-sphinx) check_sphinx;;
        --check-lint) check_lint;;
        --check-prettier) check_prettier;;
        --check-js-tests) check_js_tests;;
        --check-dockerfile) check_dockerfile;;
        --check-docker-build) check_docker_build;;
        *)
    esac
done

arg="$1"
case $arg in
    --check-commitlint) check_commitlint "$@";;
    --check-shellcheck) check_shellcheck;;
    --check-sphinx) check_sphinx;;
    --check-lint) check_lint;;
    --check-prettier) check_prettier;;
    --check-js-tests) check_js_tests;;
    --check-dockerfile) check_dockerfile;;
    --check-docker-build) check_docker_build;;
    *) echo "[ERROR] Invalid argument '$arg'. Exiting." && exit 1;;
esac
