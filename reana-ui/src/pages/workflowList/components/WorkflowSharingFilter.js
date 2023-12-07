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

const sharingFilterOptions = [
  { key: 0, text: "Owned by", value: "owned_by" },
  { key: 1, text: "Shared with", value: "shared_with" },
];

export default function WorkflowSharingFilters({
  ownedByFilter,
  setOwnedByFilter,
  sharedWithFilter,
  setSharedWithFilter,
}) {
  const dispatch = useDispatch();
  const [selectedFilterOption, setSelectedFilterOption] = useState(
    sharingFilterOptions[0],
  );
  const [dynamicOptions, setDynamicOptions] = useState([]);

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

  const [selectedUser, setSelectedUser] = useState();

  useEffect(() => {
    dispatch(fetchUsersYouSharedWith());
    dispatch(fetchUsersSharedWithYou());
  }, [dispatch]);

  useEffect(() => {
    setDynamicOptions(usersSharedWithYouOptions);
  }, [usersSharedWithYou, usersSharedWithYouOptions]);

  useEffect(() => {
    if (selectedFilterOption.value === sharingFilterOptions[0].value) {
      if (!isEqual(ownedByFilter, selectedUser?.value)) {
        setSharedWithFilter(undefined);
        setOwnedByFilter(selectedUser?.value);
      }
    } else {
      if (!isEqual(sharedWithFilter, selectedUser?.value)) {
        setOwnedByFilter(undefined);
        setSharedWithFilter(selectedUser?.value);
      }
    }
  }, [
    ownedByFilter,
    sharedWithFilter,
    setOwnedByFilter,
    setSharedWithFilter,
    selectedUser,
    selectedFilterOption.value,
  ]);

  const handleSelectedFilterOptionChange = (_, { value }) => {
    const selectedOption = sharingFilterOptions.find(
      (option) => option.value === value,
    );
    setSelectedFilterOption(selectedOption);

    if (value === sharingFilterOptions[0].value) {
      setDynamicOptions(usersSharedWithYouOptions);
      setSelectedUser(usersSharedWithYouOptions[0]);
    } else {
      setDynamicOptions(usersYouSharedWithOptions);
      setSelectedUser(usersYouSharedWithOptions[0]);
    }
  };

  const handleSelectedUserChange = (_, { value }) => {
    const selectedUser = dynamicOptions.find(
      (option) => option.value === value,
    );
    setSelectedUser(selectedUser);
  };

  return (
    <Grid.Column mobile={16} tablet={7} computer={6}>
      <div style={{ display: "flex" }}>
        <Dropdown
          text={selectedFilterOption.text}
          fluid
          closeOnChange
          selection
          options={sharingFilterOptions}
          onChange={handleSelectedFilterOptionChange}
          defaultValue={selectedFilterOption.value}
          id={styles["sharing-filter-dropdown"]}
        />
        <Dropdown
          text={selectedUser?.text || "you"}
          fluid
          selection
          search
          scrolling
          options={dynamicOptions}
          onChange={handleSelectedUserChange}
          value={selectedUser?.value || "you"}
          id={styles["selected-user-dropdown"]}
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
