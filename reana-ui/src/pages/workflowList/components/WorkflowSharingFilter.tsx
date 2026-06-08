/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useMemo } from "react";
import { Dropdown, Grid } from "semantic-ui-react";
import {
  useGetUsersSharedWithYou,
  useGetUsersYouSharedWith,
} from "~/api/hooks";
import styles from "./WorkflowSharingFilter.module.scss";

const OWNED_BY = "owned_by";
const SHARED_WITH = "shared_with";

const sharingFilterOptions = [
  { key: 0, text: "Owned by", value: OWNED_BY },
  { key: 1, text: "Shared with", value: SHARED_WITH },
];

interface WorkflowSharingFiltersProps {
  ownedByFilter?: string;
  setOwnedByFilter: (user: string) => void;
  sharedWithUser?: string;
  viewingSharedWithMe?: boolean;
  setSharedWithUser: (user: string) => void;
  setViewingSharedWithMe: (value: boolean) => void;
}

export default function WorkflowSharingFilters({
  ownedByFilter,
  setOwnedByFilter,
  sharedWithUser,
  viewingSharedWithMe,
  setSharedWithUser,
  setViewingSharedWithMe,
}: WorkflowSharingFiltersProps) {
  const { data: sharedWithYouData } = useGetUsersSharedWithYou();
  const usersSharedWithYou = sharedWithYouData?.users ?? [];
  const { data: youSharedData } = useGetUsersYouSharedWith();
  const usersYouSharedWith = youSharedData?.users ?? [];

  const usersSharedWithYouOptions = useMemo(
    () => [
      { key: "you", text: "you", value: "you" },
      { key: "anybody", text: "anybody", value: "anybody" },
      ...usersSharedWithYou.map((user: any, index: number) => ({
        key: index,
        text: user.email,
        value: user.email,
      })),
    ],
    [usersSharedWithYou],
  );

  const usersYouSharedWithOptions = useMemo(
    () => [
      { key: "anybody", text: "anybody", value: "anybody" },
      ...usersYouSharedWith.map((user: any, index: number) => ({
        key: index,
        text: user.email,
        value: user.email,
      })),
    ],
    [usersYouSharedWith],
  );

  const selectedFilterOption = viewingSharedWithMe ? SHARED_WITH : OWNED_BY;
  const selectedUser = viewingSharedWithMe
    ? (sharedWithUser ?? "anybody")
    : (ownedByFilter ?? "you");

  const handleSelectedFilterOptionChange = (_: any, { value }: any) => {
    if (value === OWNED_BY) {
      setOwnedByFilter("you");
      setViewingSharedWithMe(false);
    } else {
      setSharedWithUser("anybody");
      setViewingSharedWithMe(true);
    }
  };

  const handleSelectedUserChange = (_: any, { value }: any) => {
    if (selectedFilterOption === OWNED_BY) {
      setOwnedByFilter(value);
    } else {
      setSharedWithUser(value);
    }
  };

  return (
    <Grid.Column mobile={16} tablet={7} computer={4}>
      <div style={{ display: "flex" }}>
        <Dropdown
          fluid
          selection
          options={sharingFilterOptions}
          onChange={handleSelectedFilterOptionChange}
          value={selectedFilterOption}
          className={styles["sharing-filter-dropdown"]}
        />
        <Dropdown
          fluid
          selection
          search
          scrolling
          options={
            selectedFilterOption === OWNED_BY
              ? usersSharedWithYouOptions
              : usersYouSharedWithOptions
          }
          onChange={handleSelectedUserChange}
          value={selectedUser}
          className={styles["selected-user-dropdown"]}
        />
      </div>
    </Grid.Column>
  );
}
