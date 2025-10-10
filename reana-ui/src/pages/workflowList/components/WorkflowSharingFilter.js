/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _ from "lodash";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dropdown, Grid } from "semantic-ui-react";
import { fetchUsersSharedWithYou, fetchUsersYouSharedWith } from "~/actions";
import { getUsersSharedWithYou, getUsersYouSharedWith } from "~/selectors";
import styles from "./WorkflowSharingFilter.module.scss";

const OWNED_BY = "owned_by";
const SHARED_WITH = "shared_with";

const sharingFilterOptions = [
  { key: 0, text: "Owned by", value: OWNED_BY },
  { key: 1, text: "Shared with", value: SHARED_WITH },
];

export default function WorkflowSharingFilters({
  ownedByFilter,
  setOwnedByFilter,
  sharedWithFilter,
  sharedWithMode,
  setSharedWithFilter,
  setSharedWithModeInUrl,
}) {
  const dispatch = useDispatch();
  // Initial mode comes from URL
  const [selectedFilterOption, setSelectedFilterOption] = useState(
    sharedWithMode ? SHARED_WITH : OWNED_BY,
  );

  const usersYouSharedWith = useSelector(getUsersYouSharedWith, _.isEqual);
  const usersSharedWithYou = useSelector(getUsersSharedWithYou, _.isEqual);

  const usersSharedWithYouOptions = useMemo(
    () => [
      { key: "you", text: "you", value: "you" },
      { key: "anybody", text: "anybody", value: "anybody" },
      ...usersSharedWithYou.map((user, index) => ({
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
      ...usersYouSharedWith.map((user, index) => ({
        key: index,
        text: user.email,
        value: user.email,
      })),
    ],
    [usersYouSharedWith],
  );

  const [selectedUser, setSelectedUser] = useState(() =>
    sharedWithMode ? "anybody" : usersSharedWithYouOptions[0].value,
  );

  useEffect(() => {
    dispatch(fetchUsersYouSharedWith());
    dispatch(fetchUsersSharedWithYou());
  }, [dispatch]);

  // Keep the dropdown value aligned with URL
  useEffect(() => {
    if (selectedFilterOption === OWNED_BY) {
      setSelectedUser(ownedByFilter ?? usersSharedWithYouOptions[0].value);
    } else {
      setSelectedUser(sharedWithFilter ?? "anybody");
    }
  }, [
    selectedFilterOption,
    ownedByFilter,
    sharedWithFilter,
    usersSharedWithYouOptions,
  ]);

  // Reflect URL back if user edited the URL manually
  useEffect(() => {
    setSelectedFilterOption(sharedWithMode ? SHARED_WITH : OWNED_BY);
  }, [sharedWithMode]);

  const handleSelectedFilterOptionChange = (_, { value }) => {
    setSelectedFilterOption(value);

    if (value === OWNED_BY) {
      setOwnedByFilter("you");
      setSharedWithFilter(undefined);
      setSelectedUser("you");
      setSharedWithModeInUrl(false);
    } else {
      setSharedWithFilter("anybody");
      setSelectedUser("anybody");
      setSharedWithModeInUrl(true);
    }
  };

  const handleSelectedUserChange = (_, { value }) => {
    if (selectedFilterOption === OWNED_BY) {
      setOwnedByFilter(value);
      setSharedWithFilter(undefined);
    } else {
      setSharedWithFilter(value);
      setOwnedByFilter(undefined);
    }
  };

  return (
    <Grid.Column mobile={16} tablet={7} computer={6}>
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

WorkflowSharingFilters.propTypes = {
  ownedByFilter: PropTypes.string,
  setOwnedByFilter: PropTypes.func.isRequired,
  sharedWithFilter: PropTypes.string,
  sharedWithMode: PropTypes.bool,
  setSharedWithFilter: PropTypes.func.isRequired,
};
