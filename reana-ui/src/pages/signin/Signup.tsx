/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020, 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader, Segment } from "semantic-ui-react";
import { Link, useNavigate } from "react-router-dom";

import SignForm from "./components/SignForm";
import SignContainer from "./components/SignContainer";
import { useGetConfig } from "~/api/hooks";
import client from "~/client";
import { useDocumentTitle } from "~/hooks";

export default function Signup() {
  useDocumentTitle("Sign up");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: configData, isLoading: configLoading } = useGetConfig();
  const [formData, setFormData] = useState<{ email: string; password: string }>(
    { email: "", password: "" },
  );
  const [signErrors, setSignErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);

  if (configLoading) {
    return (
      <SignContainer>
        <Loader active inline="centered" />
      </SignContainer>
    );
  }

  // localUsers defaults to true so the form is shown when config isn't available
  const localUsers: boolean = configData?.localUsers !== false;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    setFormData({ ...formData, [target.name]: target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignErrors([]);
    try {
      await client.signUp(formData);
      queryClient.invalidateQueries({ queryKey: ["/api/you"] });
      navigate("/signin", { replace: true });
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setSignErrors(err.response.data.errors);
      } else {
        setSignErrors([
          {
            field: "email",
            message: err?.response?.data?.message || "Sign-up failed",
          },
        ]);
      }
      setFormData({ ...formData, password: "" });
    }
  };

  return (
    <SignContainer>
      <Segment>
        {localUsers && (
          <SignForm
            submitText="Sign up"
            handleSubmit={handleSignup}
            formData={formData}
            handleInputChange={handleInputChange}
            errors={signErrors}
          />
        )}
      </Segment>
      {localUsers && (
        <p>
          Already signed up? Go to <Link to="/signin">Sign in</Link>
        </p>
      )}
    </SignContainer>
  );
}
