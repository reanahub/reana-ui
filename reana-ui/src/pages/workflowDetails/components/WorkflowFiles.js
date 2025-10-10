/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2021, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import sortBy from "lodash/sortBy";
import PropTypes from "prop-types";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon, Loader, Message, Segment, Table } from "semantic-ui-react";

import { fetchWorkflowFiles } from "~/actions";
import { Pagination, Search } from "~/components";
import {
  getWorkflowFiles,
  getWorkflowFilesCount,
  loadingDetails,
} from "~/selectors";
import { WorkflowRetentionRules } from ".";
import FilePreview from "./filePreview/FilePreview";

import styles from "./WorkflowFiles.module.scss";

const PAGE_SIZE = 15;

export default function WorkflowFiles({ id, page = 1, onPageChange }) {
  const dispatch = useDispatch();
  const loading = useSelector(loadingDetails);
  const _files = useSelector(getWorkflowFiles(id));
  const filesCount = useSelector(getWorkflowFilesCount(id));

  const [files, setFiles] = useState();
  const [sorting, setSorting] = useState({ column: null, direction: null });
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(
    () => searchParams.get("search") || "",
  );
  const searchQuery = (searchParams.get("search") || "").trim();
  const [filePreview, setFilePreview] = useState(null);

  // Use pagination from parent-controlled URL page (memoized to avoid extra effects)
  const pagination = useMemo(
    () => ({ page: page || 1, size: PAGE_SIZE }),
    [page],
  );

  // Keep input in sync when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearchText((prev) => (prev !== urlSearch ? urlSearch : prev));
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchWorkflowFiles(id, pagination, searchQuery));
  }, [dispatch, id, pagination, searchQuery]);

  useEffect(() => {
    setFiles(_files);
  }, [_files]);

  /**
   * Performs the sorting when a column header is clicked
   */
  function handleSort(clickedColumn) {
    if (sorting.column !== clickedColumn) {
      setFiles(sortBy(files, [clickedColumn]));
      setSorting({ direction: "ascending", column: clickedColumn });
      return;
    }
    setFiles(files.reverse());
    setSorting({
      ...sorting,
      direction: sorting.direction === "ascending" ? "descending" : "ascending",
    });
  }

  function resetSort() {
    setSorting({ column: null, direction: null });
  }

  const headerIcon = (col) => (
    <Icon
      name={
        sorting.column === col
          ? sorting.direction === "ascending"
            ? "sort ascending"
            : "sort descending"
          : "sort"
      }
    />
  );

  // Submit search on Enter/click, then reset to page 1 (remove ?page)
  const submitSearch = () => {
    const q = searchText.trim();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (q) next.set("search", q);
        else next.delete("search");
        // Reset to first page by removing page param
        next.delete("page");
        return next;
      },
      { replace: true },
    );
    resetSort();
  };

  return files === null ? (
    <Message
      icon="info circle"
      content="The workflow workspace was deleted."
      info
    />
  ) : (
    <>
      <WorkflowRetentionRules id={id} />
      <Search
        value={searchText}
        onChange={setSearchText}
        onSubmit={submitSearch}
      />
      {loading ? (
        <Loader active inline="centered" className={styles["loader"]} />
      ) : (
        <Segment>
          <Table fixed compact basic="very">
            <Table.Header className={styles["table-header"]}>
              <Table.Row>
                <Table.HeaderCell
                  sorted={sorting.column === "name" ? sorting.direction : null}
                  onClick={() => handleSort("name")}
                >
                  Name {headerIcon("name")}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    sorting.column === "lastModified" ? sorting.direction : null
                  }
                  onClick={() => handleSort("lastModified")}
                >
                  Modified {headerIcon("lastModified")}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    sorting.column === "size.raw" ? sorting.direction : null
                  }
                  onClick={() => handleSort("size.raw")}
                >
                  Size {headerIcon("size.raw")}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {files &&
                files.map(({ name, lastModified, size }) => (
                  <Table.Row
                    key={name}
                    className={styles["files-row"]}
                    onClick={() =>
                      setFilePreview({
                        workflow: id,
                        fileName: name,
                        size: size.raw,
                      })
                    }
                  >
                    <Table.Cell>
                      <Icon name="file" />
                      {name}
                    </Table.Cell>
                    <Table.Cell>{lastModified}</Table.Cell>
                    <Table.Cell>{size.human_readable || size.raw}</Table.Cell>
                  </Table.Row>
                ))}
            </Table.Body>
          </Table>

          {filePreview && (
            <FilePreview
              {...filePreview}
              onClose={() => setFilePreview(null)}
            />
          )}

          {filesCount > PAGE_SIZE && (
            <div className={styles["pagination-wrapper"]}>
              <Pagination
                activePage={pagination.page}
                totalPages={Math.ceil(filesCount / PAGE_SIZE)}
                onPageChange={(_, { activePage }) => {
                  if (typeof onPageChange === "function") {
                    onPageChange(activePage);
                  }
                  resetSort();
                }}
                size="mini"
              />
            </div>
          )}
        </Segment>
      )}
    </>
  );
}

WorkflowFiles.propTypes = {
  id: PropTypes.string.isRequired,
  page: PropTypes.number, // Current page coming from the URL
  onPageChange: PropTypes.func, // Notify parent to update the URL when user paginates
};
