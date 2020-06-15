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

export default function SignForm({ submitText, handleSubmit }) {
  return (
    <Form>
      <Form.Field>
        <label>Email</label>
        <input name="email" type="email" />
      </Form.Field>
      <Form.Field>
        <label>Password</label>
        <input name="password" type="password" />
      </Form.Field>
      <Button primary fluid onClick={handleSubmit}>
        {submitText}
      </Button>
    </Form>
  );
}

SignForm.propTypes = {
  submitText: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired
};
