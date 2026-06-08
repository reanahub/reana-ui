/*
	-*- coding: utf-8 -*-

	This file is part of REANA.
	Copyright (C) 2020, 2021, 2022, 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import sortBy from "lodash/sortBy";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Icon,
  Loader,
  Message,
  Segment,
  Table,
} from "semantic-ui-react";

import { useGetFiles } from "~/api/hooks";
import { WORKFLOW_FILE_URL } from "~/client";
import { Pagination, Search } from "~/components";
import { parseFiles } from "~/util";
import { CopyLinkButton, WorkflowRetentionRules } from ".";
import FilePreview from "./filePreview/FilePreview";

import styles from "./WorkflowFiles.module.scss";

const PAGE_SIZE = 15;

interface WorkflowFilesProps {
  title?: string;
  id: string;
  page?: number;
  onPageChange?: (page: number) => void;
}

interface FileSortingState {
  column: string | null;
  direction: "ascending" | "descending" | null;
}

interface FilePreviewState {
  workflow: string;
  fileName: string;
}

function getDownloadURL(workflow: string, fileName: string): string {
  return WORKFLOW_FILE_URL(workflow, fileName, { preview: false });
}

function openPreviewParams(
  prev: URLSearchParams,
  name: string,
): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.set("name", name);
  return next;
}

function closePreviewParams(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.delete("name");
  return next;
}

export function getErrorStatus(error: unknown): number | undefined {
  return (error as any)?.response?.status ?? (error as any)?.status;
}

export function isDeletedWorkspaceError(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

export default function WorkflowFiles({
  id,
  page = 1,
  onPageChange,
}: WorkflowFilesProps) {
  const [files, setFiles] = useState<any[] | null | undefined>(undefined);
  const [sorting, setSorting] = useState<FileSortingState>({
    column: null,
    direction: null,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(
    () => searchParams.get("search") || "",
  );
  const searchQuery = (searchParams.get("search") || "").trim();
  const [filePreview, setFilePreview] = useState<FilePreviewState | null>(null);

  // Use pagination from parent-controlled URL page (memoized to avoid extra effects)
  const pagination = useMemo(
    () => ({ page: page || 1, size: PAGE_SIZE }),
    [page],
  );

  const {
    data: filesData,
    error: filesError,
    isLoading: loading,
  } = useGetFiles(
    id,
    {
      page: pagination.page,
      size: pagination.size,
      search: searchQuery || undefined,
    },
    {
      query: {
        retry: (failureCount, error) =>
          !isDeletedWorkspaceError(error) && failureCount < 3,
      },
    },
  );

  const filesCount = filesData?.total ?? 0;

  // Sync filePreview state from URL params
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const fileName = searchParams.get("name") || "";

    if (fileName) {
      setFilePreview({ workflow: id, fileName });
    } else {
      setFilePreview(null);
    }
    setSearchText((prev) => (prev !== urlSearch ? urlSearch : prev));
  }, [searchParams, id]);

  useEffect(() => {
    if (isDeletedWorkspaceError(filesError)) {
      setFiles(null);
      return;
    }
    if (filesData?.items !== undefined) {
      setFiles(parseFiles(filesData.items as any[]));
    }
  }, [filesData, filesError]);

  /**
   * Performs the sorting when a column header is clicked
   */
  function handleSort(clickedColumn: string): void {
    if (sorting.column !== clickedColumn) {
      setFiles(sortBy(files, [clickedColumn]));
      setSorting({ direction: "ascending", column: clickedColumn });
      return;
    }
    setFiles([...files].reverse());
    setSorting({
      ...sorting,
      direction: sorting.direction === "ascending" ? "descending" : "ascending",
    });
  }

  function resetSort(): void {
    setSorting({ column: null, direction: null });
  }

  const headerIcon = (col: string) => (
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

  const openPreview = (name: string, fileSize: number): void => {
    setSearchParams((prev) => openPreviewParams(prev, name), {
      replace: false,
      state: { internal: true, size: fileSize },
    });
  };

  const closePreview = (): void => {
    setSearchParams((prev) => closePreviewParams(prev), { replace: false });
  };

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

  const buildShareLink = (name: string): string =>
    `${window.location.origin}/workflows/${id}/workspace?name=${encodeURIComponent(name)}`;

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
                <Table.HeaderCell
                  width={3}
                  textAlign="center"
                ></Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {files &&
                files.map(({ name, lastModified, size }) => (
                  <Table.Row
                    key={name}
                    className={styles["files-row"]}
                    onClick={() => openPreview(name, size.raw)}
                  >
                    <Table.Cell>
                      <Icon name="file" />
                      {name}
                    </Table.Cell>
                    <Table.Cell>{lastModified}</Table.Cell>
                    <Table.Cell>{size.human_readable || size.raw}</Table.Cell>
                    <Table.Cell
                      className={styles["copy-link-cell"]}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        icon="eye"
                        size="mini"
                        aria-label={`Preview ${name}`}
                        onClick={() => openPreview(name, size.raw)}
                      />
                      <Button
                        size="mini"
                        icon="download"
                        as="a"
                        href={getDownloadURL(id, name)}
                        aria-label={`Download ${name}`}
                      />
                      <CopyLinkButton
                        url={buildShareLink(name)}
                        fileName={name}
                        size="mini"
                        aria-label={`Copy shareable link to ${name}`}
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table.Body>
          </Table>

          {filePreview && (
            <FilePreview {...filePreview} onClose={closePreview} />
          )}

          {filesCount > PAGE_SIZE && (
            <div className={styles["pagination-wrapper"]}>
              <Pagination
                activePage={pagination.page}
                totalPages={Math.ceil(filesCount / PAGE_SIZE)}
                onPageChange={(_: any, { activePage }: any) => {
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
