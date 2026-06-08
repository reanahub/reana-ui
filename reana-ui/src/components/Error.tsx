/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container, Image } from "semantic-ui-react";

import LogoImg from "~/images/logo-reana.svg";

import styles from "./Error.module.scss";

interface Props {
  message?: string;
  title?: string;
}

export default function Error({ message = "", title = "Error" }: Props) {
  return (
    <Container textAlign="center" className={styles.container}>
      <Image centered spaced src={LogoImg} size="small" />
      <h3>{title}</h3>
      <div>{message}</div>
    </Container>
  );
}
