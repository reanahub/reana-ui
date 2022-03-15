/*
  This file is part of REANA.
  Copyright (C) 2022 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Button, Container, Grid, Image } from "semantic-ui-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import { getConfig } from "~/selectors";
import exampleRootImg from "~/images/example-root.png";
import exampleAtlasRecastImg from "~/images/example-atlas-recast.png";
import exampleCmsHttImg from "~/images/example-cms-htt.png";

import styles from "./Welcome.module.scss";

const DEMOS = [
  {
    name: "RooFit",
    url: "https://github.com/reanahub/reana-demo-root6-roofit",
    image: exampleRootImg,
  },
  {
    name: "ATLAS RECAST",
    url: "https://github.com/reanahub/reana-demo-atlas-recast/",
    image: exampleAtlasRecastImg,
  },
  {
    name: "CMS HTauTau",
    url: "https://github.com/cms-opendata-analyses/HiggsTauTauNanoAODOutreachAnalysis",
    image: exampleCmsHttImg,
  },
];

export default function Welcome() {
  const { docsURL } = useSelector(getConfig);

  return (
    <Container text className={styles.container}>
      <p>
        This page allows you to launch analysis workflows hosted on external
        sources such as GitHub, GitLab, Zenodo.
      </p>
      <p>You can start by launching one of the following demo examples:</p>
      <Grid columns={DEMOS.length} padded>
        <Grid.Row>
          {DEMOS.map((demoProps) => (
            <Grid.Column key={demoProps.name} textAlign="center">
              <DemoCard {...demoProps} />
            </Grid.Column>
          ))}
        </Grid.Row>
      </Grid>
      <p>
        If your analysis is hosted on an external site such as GitLab, GitHub or
        Zenodo, please provide a <code>url</code> parameter that would point to
        where your analysis is hosted. See the{" "}
        <a href={`${docsURL}/running-workflows/launch-with-badge/`}>
          launcher docs
        </a>{" "}
        for more details.
      </p>
    </Container>
  );
}

function DemoCard({ url, image, name }) {
  return (
    <div className={styles["demo-card"]}>
      <div className={styles["img-wrapper"]}>
        <Image src={image} alt={`${name} demo example illustration.`} />
      </div>
      <Link
        to={{
          pathname: window.location.pathname,
          search: new URLSearchParams({
            url: url,
            name: `my-${name.toLowerCase().replace(" ", "-")}-analysis`,
            spec: "reana.yaml",
          }).toString(),
        }}
      >
        <Button
          content={`Try ${name} demo`}
          size="small"
          className={styles.btn}
        />
      </Link>
    </div>
  );
}
