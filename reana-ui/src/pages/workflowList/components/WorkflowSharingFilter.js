/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import _, { isEqual } from "lodash";
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
  setSharedWithFilter,
}) {
  const dispatch = useDispatch();
  const [selectedFilterOption, setSelectedFilterOption] = useState(OWNED_BY);

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

  const [selectedUser, setSelectedUser] = useState(
    usersSharedWithYouOptions[0].value,
  );

  useEffect(() => {
    dispatch(fetchUsersYouSharedWith());
    dispatch(fetchUsersSharedWithYou());
  }, [dispatch]);

  useEffect(() => {
    // synchronise local state with parent state
    if (selectedFilterOption === OWNED_BY) {
      if (!isEqual(ownedByFilter, selectedUser)) {
        setSharedWithFilter(undefined);
        setOwnedByFilter(selectedUser);
      }
    } else {
      if (!isEqual(sharedWithFilter, selectedUser)) {
        setSharedWithFilter(selectedUser);
        setOwnedByFilter(undefined);
      }
    }
  }, [
    ownedByFilter,
    sharedWithFilter,
    setOwnedByFilter,
    setSharedWithFilter,
    selectedUser,
    selectedFilterOption,
  ]);

  const handleSelectedFilterOptionChange = (_, { value }) => {
    setSelectedFilterOption(value);

    if (value === OWNED_BY) {
      setSelectedUser(usersSharedWithYouOptions[0].value);
    } else {
      setSelectedUser(usersYouSharedWithOptions[0].value);
    }
  };

  const handleSelectedUserChange = (_, { value }) => {
    setSelectedUser(value);
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
  setSharedWithFilter: PropTypes.func.isRequired,
};
