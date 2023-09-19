/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Button, Card, Container, Icon } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { getConfig } from "~/selectors";

import exampleRootImg from "~/images/example-root.png";
import exampleAtlasRecastImg from "~/images/example-atlas-recast.png";
import exampleCmsHiggsTauTauImg from "~/images/example-cms-htt.png";

import styles from "./Welcome.module.scss";

const DEFAULT_DEMO_REPOSITORIES = [
  {
    name: "RooFit",
    url: "https://github.com/reanahub/reana-demo-root6-roofit",
    image_url: exampleRootImg,
    specification: "reana.yaml",
  },
  {
    name: "ATLAS RECAST",
    url: "https://github.com/reanahub/reana-demo-atlas-recast/",
    image_url: exampleAtlasRecastImg,
    specification: "reana.yaml",
  },
  {
    name: "CMS HiggsTauTau",
    url: "https://github.com/cms-opendata-analyses/HiggsTauTauNanoAODOutreachAnalysis",
    image_url: exampleCmsHiggsTauTauImg,
    specification: "reana.yaml",
  },
];

export default function Welcome() {
  const { docsURL, launcherExamples: repositoriesFromConfig } =
    useSelector(getConfig);

  // If the REANA admin has not specified a list of demo repositories, use the
  // default ones.
  const launcherExamples = repositoriesFromConfig ?? DEFAULT_DEMO_REPOSITORIES;

  return (
    <Container text className={styles.container}>
      <p>
        This page allows you to launch analysis workflows hosted on external
        sources such as GitHub, GitLab, Zenodo.
      </p>
      <p>
        If your analysis is hosted on an external site, please provide a{" "}
        <code>url</code> parameter that would point to where your analysis is
        hosted. See the{" "}
        <a href={`${docsURL}/running-workflows/launching-workflows/`}>
          launcher docs
        </a>{" "}
        for more details.
      </p>
      <p>You can start by launching one of the following demo examples:</p>
      <Card.Group itemsPerRow={3} className={styles["card-container"]} centered>
        {launcherExamples.map((demoProps, index) => (
          <DemoCard {...demoProps} key={index} />
        ))}
      </Card.Group>
    </Container>
  );
}

function DemoCard({ url, image_url, name, specification, description }) {
  function DemoLink({ children }) {
    return (
      <Link
        to={{
          pathname: window.location.pathname,
          search: new URLSearchParams({
            url: url,
            name: `my-${name.toLowerCase().replace(" ", "-")}-analysis`,
            ...(specification && { specification }),
          }).toString(),
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <Card className={styles["demo-card"]}>
      <DemoLink>
        <div className={styles["img-container"]}>
          <img
            src={image_url}
            className={styles["blur-background-image"]}
            alt={name}
          />
          <img src={image_url} alt={name} />
        </div>
      </DemoLink>
      <Card.Content>
        <Card.Description>
          <p className={styles["analysis-name"]}>{name}</p>
          {description && <p>{description}</p>}
        </Card.Description>
      </Card.Content>
      <Card.Content textAlign="center" extra>
        <DemoLink>
          <Button size="tiny" className={styles.btn}>
            <Icon name="rocket" />
            Launch demo
          </Button>
        </DemoLink>
      </Card.Content>
    </Card>
  );
}
