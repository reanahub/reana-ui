/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { useSelector } from "react-redux";
import { Button, Form, Input } from "semantic-ui-react";
import PropTypes from "prop-types";

import { getUserSignErrors } from "~/selectors";

import styles from "./SignForm.module.scss";

export default function SignForm({
  submitText,
  handleSubmit,
  formData,
  handleInputChange,
}) {
  const errors = useSelector(getUserSignErrors);

  /**
   * Gets Form.Field compatible error prop per field/
   * @param {String} field Name of the field to get errors from
   */
  function getFieldErrors(field) {
    const fieldErrors = errors?.filter((err) => err.field === field);
    return (
      !!fieldErrors?.length && {
        content: fieldErrors.map((err) => (
          <p key={err.message}>{err.message}</p>
        )),
        pointing: "above",
      }
    );
  }
  return (
    <Form onSubmit={handleSubmit} className={styles.form}>
      <Form.Field
        control={Input}
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        error={getFieldErrors("email")}
        required
      />
      <Form.Field
        control={Input}
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
        error={getFieldErrors("password")}
        required
      />
      <Button type="submit" primary fluid>
        {submitText}
      </Button>
    </Form>
  );
}

SignForm.propTypes = {
  submitText: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired,
};
