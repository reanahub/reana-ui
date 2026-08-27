/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Message } from "semantic-ui-react";

import { loadGitlabWebhookTokenStatus } from "~/actions";
import {
  getGitlabWebhookToken,
  getGitlabWebhookTokenRequest,
  isSignedIn,
} from "~/selectors";

export function webhookAuthorizationIsExpired(status, now = Date.now()) {
  if (!status?.configured) return false;
  const expiresAt = Date.parse(status.expires_at);
  return status.expired || (Number.isFinite(expiresAt) && expiresAt <= now);
}

export function webhookAuthorizationNeedsAttention(status, now = Date.now()) {
  if (!status?.configured) return false;
  const expiresAt = Date.parse(status.expires_at);
  if (webhookAuthorizationIsExpired(status, now)) return true;
  const maxLifetime = Number(status.max_lifetime_seconds) * 1000;
  return (
    Number.isFinite(expiresAt) &&
    Number.isFinite(maxLifetime) &&
    maxLifetime > 0 &&
    expiresAt - now <= maxLifetime / 4
  );
}

export function nextWebhookAuthorizationTransition(status, now = Date.now()) {
  if (!status?.configured) return null;
  const expiresAt = Date.parse(status.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  const maxLifetime = Number(status.max_lifetime_seconds) * 1000;
  const warningAt =
    Number.isFinite(maxLifetime) && maxLifetime > 0
      ? expiresAt - maxLifetime / 4
      : null;
  return warningAt !== null && warningAt > now ? warningAt : expiresAt;
}

export default function WebhookExpiryWarning() {
  const dispatch = useDispatch();
  const [now, setNow] = useState(Date.now());
  const signedIn = useSelector(isSignedIn);
  // Shared with GitLabProjects's profile-page view: a renewal made there
  // dispatches to the same state, so this banner updates immediately
  // instead of waiting for its own next fetch.
  const status = useSelector(getGitlabWebhookToken);
  const { phase, retryAt } = useSelector(getGitlabWebhookTokenRequest);

  useEffect(() => {
    if (!signedIn) return undefined;

    if (phase === "idle") {
      dispatch(loadGitlabWebhookTokenStatus());
      return undefined;
    }

    let retryTimer;
    if (phase === "retry_wait") {
      const retryDelay = Math.max(0, retryAt - Date.now());
      retryTimer = window.setTimeout(
        () => dispatch(loadGitlabWebhookTokenStatus({ automaticRetry: true })),
        retryDelay,
      );
    }

    return () => {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [signedIn, phase, retryAt, dispatch]);

  useEffect(() => {
    const transitionAt = nextWebhookAuthorizationTransition(status, now);
    if (transitionAt === null) return undefined;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(transitionAt - now, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [status, now]);

  if (!signedIn || !webhookAuthorizationNeedsAttention(status, now))
    return null;

  const expired = webhookAuthorizationIsExpired(status, now);

  return (
    <Message warning>
      <Message.Header>
        GitLab webhook authorization {expired ? "has expired" : "expires soon"}
      </Message.Header>
      <p>
        Renew it from <Link to="/profile">your profile</Link> so GitLab can keep
        starting workflows.
      </p>
    </Message>
  );
}
