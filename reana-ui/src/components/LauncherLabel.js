/*
  This file is part of REANA.
  Copyright (C) 2022, 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import PropTypes from "prop-types";
import { Label, Popup } from "semantic-ui-react";

export default function LauncherLabel({ url }) {
  /**
   * Return appropriate Label component props according to the given launcher URL.
   * @param {String} url Submission workflow launcher URL.
   * @returns {Object} Appropriate component props.
   */
  function getProps(url) {
    const parsedURL = new URL(url);
    const propsMapping = {
      "zenodo.org": { content: "Zenodo" },
      "github.com": { content: "GitHub", icon: "github" },
      default: { content: "URL", icon: "linkify" },
    };

    return propsMapping[parsedURL.hostname] ?? propsMapping.default;
  }

  return (
    !!url && (
      <Popup
        trigger={
          <Label
            size="tiny"
            as="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            {...getProps(url)}
          />
        }
        content={url}
        size="small"
        wide="very"
      />
    )
  );
}

LauncherLabel.propTypes = {
  url: PropTypes.string,
};

LauncherLabel.defaultProps = {
  url: null,
};
