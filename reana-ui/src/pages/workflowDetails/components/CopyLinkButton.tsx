/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2026 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import { Button, Popup } from "semantic-ui-react";
import copy from "copy-to-clipboard";

const COPY_CHECK_TIMEOUT = 1000;

interface CopyLinkButtonProps {
  url: string;
  fileName: string;
  size?: string;
  label?: string;
}

export default function CopyLinkButton({
  url,
  fileName,
  size,
  label,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleClick = (): void => {
    copy(url, {
      format: "text/plain",
      onCopy: () => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPY_CHECK_TIMEOUT);
        return new ClipboardItem({
          "text/html": new Blob([`<a href="${url}">${fileName}</a>`], {
            type: "text/html",
          }),
          "text/plain": new Blob([url], { type: "text/plain" }),
        });
      },
    });
  };

  return (
    <Popup
      inverted
      trigger={
        <Button
          size={size as any}
          icon="linkify"
          content={label}
          aria-label={`Copy link to ${fileName}`}
          onClick={handleClick}
        />
      }
      open={copied}
    >
      <Popup.Content>
        <p>Link copied to clipboard!</p>
      </Popup.Content>
    </Popup>
  );
}
