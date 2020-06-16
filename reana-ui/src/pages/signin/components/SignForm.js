/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React from "react";
import { Button, Form } from "semantic-ui-react";
import PropTypes from "prop-types";

export default function SignForm({
  submitText,
  handleSubmit,
  formData,
  handleInputChange
}) {
  return (
    <Form onSubmit={handleSubmit}>
      <Form.Field>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </Form.Field>
      <Form.Field>
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </Form.Field>
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
  handleInputChange: PropTypes.func.isRequired
};
