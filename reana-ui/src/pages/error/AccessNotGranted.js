/*
  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import Error from "~/components/Error";
import Notification from "~/components/Notification";
import { userSignout } from "~/actions";
import { useDispatch } from "react-redux";
import { Button } from "semantic-ui-react";

export default function AccessNotGranted() {
  const dispatch = useDispatch();
  return (
    <>
      <Notification />
      <Error
        title="Access not granted"
        message="You are authenticated, but your identity is not entitled to use this REANA deployment. Contact the deployment administrator to request access."
        action={
          <Button onClick={() => dispatch(userSignout())}>Sign out</Button>
        }
      />
    </>
  );
}
