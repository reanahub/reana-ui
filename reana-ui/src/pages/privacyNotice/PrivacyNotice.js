/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2020 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { Container, Table, Divider } from "semantic-ui-react";

import { Title } from "../../components";
import BasePage from "../BasePage";

import styles from "./PrivacyNotice.module.scss";

export default function PrivacyNoticePage() {
  return (
    <BasePage>
      <PrivacyNotice />
    </BasePage>
  );
}

function PrivacyNotice() {
  return (
    <Container className={styles["container"]}>
      <Title as="h2">CERN Privacy Notice PN00915</Title>

      <Title as="h3">How is your data used</Title>
      <p>
        Each service at CERN is responsible for compiling its own Privacy Notice
        regarding the data it processes.
      </p>
      <p>
        This Privacy Notice is part of{" "}
        <a
          href="https://cern.service-now.com/service-portal?id=layered_privacy_notice"
          target="_blank"
          rel="noopener noreferrer"
        >
          CERN’s Layered Privacy Notice
        </a>{" "}
        and details the processing that is unique to REANA. It does not address
        processing by other services on which this service may rely and which
        have their own Privacy Notice.
      </p>

      <Title as="h3">Personal Data we process</Title>
      <p>The personal data we have, and how it's used:</p>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Personal Data</Table.HeaderCell>
            <Table.HeaderCell>Purpose</Table.HeaderCell>
            <Table.HeaderCell>Basis</Table.HeaderCell>
            <Table.HeaderCell>Source</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              Your access logs (IP address, visited URLs on REANA and
              corresponding timestamp)
            </Table.Cell>
            <Table.Cell>
              User support, website debugging, security auditing and to produce
              statistics
            </Table.Cell>
            <Table.Cell>Legitimate interest of CERN</Table.Cell>
            <Table.Cell>
              Automatically transferred by your web browser
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>E-mail address</Table.Cell>
            <Table.Cell>
              Unique identifier for your REANA account, used to sign in, grant
              access rights, and send email communications
            </Table.Cell>
            <Table.Cell>Legitimate interest of CERN</Table.Cell>
            <Table.Cell>CERN Single Sign-On</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>E-group membership</Table.Cell>
            <Table.Cell>Used for authorisation purposes</Table.Cell>
            <Table.Cell>Legitimate interest of CERN</Table.Cell>
            <Table.Cell>CERN Single Sign-On</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Account name</Table.Cell>
            <Table.Cell>
              Used for authentication and to enable the integration with CERN
              GitLab service
            </Table.Cell>
            <Table.Cell>Legitimate interest of CERN</Table.Cell>
            <Table.Cell>CERN Single Sign-On</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Access token</Table.Cell>
            <Table.Cell>
              Used by REANA Client for REST API authentication and authorisation
            </Table.Cell>
            <Table.Cell>Legitimate interest of CERN</Table.Cell>
            <Table.Cell>Created by REANA at first login</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>List of REANA jobs you created</Table.Cell>
            <Table.Cell>
              Used to manage and display information about your REANA jobs (e.g.
              logs of running tasks, outputs, etc)
            </Table.Cell>
            <Table.Cell>Legitimate interest of CERN</Table.Cell>
            <Table.Cell>Your input</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>

      <Title as="h3">
        Description of legal basis for processing of Personal Data by REANA
      </Title>
      <ul>
        <li>
          <strong>Contract:</strong> To fulfil a contractual relationship with
          the individual, or in preparation for a contract with the individual
        </li>
        <li>
          <strong>Legal Obligation:</strong> To comply with a legal obligation
          of CERN.
        </li>
        <li>
          <strong>Consent:</strong> By having received and recorded consent from
          the individual.
        </li>
        <li>
          <strong>Legitimate interest of CERN:</strong> In the legitimate
          interests of CERN supporting the professional activities of the
          individual or their security and safety.
        </li>
      </ul>

      <Title as="h3">Personal Data we keep</Title>
      <p>The personal data we store, for how long and why:</p>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Personal Data</Table.HeaderCell>
            <Table.HeaderCell>
              Retention Period <sup>1</sup>
            </Table.HeaderCell>
            <Table.HeaderCell>Purpose</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              Your access logs (IP address, visited URLs on REANA and
              corresponding timestamp)
            </Table.Cell>
            <Table.Cell>Maximum 13 months from date of action</Table.Cell>
            <Table.Cell>
              User support, website debugging, security auditing and to produce
              statistics
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>E-mail address</Table.Cell>
            <Table.Cell>Lifetime of your REANA account</Table.Cell>
            <Table.Cell>
              Unique identifier for your REANA account, used to sign in, grant
              access rights, and send email communications
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>E-group membership</Table.Cell>
            <Table.Cell>Lifetime of your REANA account</Table.Cell>
            <Table.Cell>Used for authorisation purposes</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Account name</Table.Cell>
            <Table.Cell>Lifetime of your REANA account</Table.Cell>
            <Table.Cell>
              Used for authentication and to enable the integration with CERN
              GitLab service
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Access token</Table.Cell>
            <Table.Cell>
              Lifetime of your REANA account or until revoked by administrators
            </Table.Cell>
            <Table.Cell>API authentication and authorisation</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>List of REANA jobs you created</Table.Cell>
            <Table.Cell>Lifetime of your REANA account</Table.Cell>
            <Table.Cell>
              Used to manage and display information about your REANA jobs (e.g.
              logs of running tasks, outputs, etc)
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>

      <Title as="h3">Who at CERN has access</Title>
      <p>
        In addition to yourself, personal data collected by REANA is accessible
        by the following services, teams or individuals at CERN:
      </p>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Personal Data</Table.HeaderCell>
            <Table.HeaderCell>Who</Table.HeaderCell>
            <Table.HeaderCell>Purpose</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              Your access logs (IP address, visited URLs on REANA, and
              corresponding timestamp)
            </Table.Cell>
            <Table.Cell>
              REANA administrators and CERN Services administrators (Cloud
              Infrastructure)
            </Table.Cell>
            <Table.Cell>User support and service operations</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>E-mail address</Table.Cell>
            <Table.Cell>
              REANA administrators and CERN Services administrators (Database on
              demand service)
            </Table.Cell>
            <Table.Cell>User support and service operations</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>E-group membership</Table.Cell>
            <Table.Cell>
              REANA administrators and CERN Services administrators (Database on
              demand service)
            </Table.Cell>
            <Table.Cell>User support and service operations</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Account name</Table.Cell>
            <Table.Cell>
              REANA administrators and CERN Services administrators (Database on
              demand service)
            </Table.Cell>
            <Table.Cell>User support and service operations</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Access token</Table.Cell>
            <Table.Cell>
              REANA administrators and CERN Services administrators (Database on
              demand service)
            </Table.Cell>
            <Table.Cell>User support and service operations</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>List of REANA jobs you created</Table.Cell>
            <Table.Cell>
              REANA administrators and CERN Services administrators (Database on
              demand service)
            </Table.Cell>
            <Table.Cell>User support and service operations</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>

      <p>
        For more detailed information about personal data and privacy please
        refer to the{" "}
        <a
          href="https://privacy.web.cern.ch/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Data Privacy web site
        </a>
        .
      </p>
      <p>
        For questions regarding this Privacy Notice, please contact{" "}
        <a href="mailto:reana-support@cern.ch">reana-support@cern.ch</a>.
      </p>
      <p>
        For questions regarding personal data and privacy please contact the{" "}
        <a
          href="https://privacy.web.cern.ch/office-data-privacy-odp"
          target="_blank"
          rel="noopener noreferrer"
        >
          Office of Data Privacy
        </a>
        .
      </p>
      <p>
        To request to exercise data subject rights please fill and submit the
        following{" "}
        <a
          href="https://cern.service-now.com/service-portal?id=sc_cat_item&name=data-subject-rights&se=Data-Privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          online form
        </a>
        .
      </p>
      <p>This Privacy Notice is subject to revision.</p>
      <p>
        <em>Last revision: 2020-10-09 18:04:55</em>
      </p>
      <Divider />
      <p>
        <sup>1</sup> The retention period may be temporarily extended for
        special circumstances, in accordance with the provisions of the
        operation circular governing data privacy.{" "}
      </p>
    </Container>
  );
}
