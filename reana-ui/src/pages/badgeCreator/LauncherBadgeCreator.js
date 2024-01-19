/*
  This file is part of REANA.
  Copyright (C) 2023 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useState } from "react";
import {
  Button,
  Container,
  Divider,
  Form,
  Icon,
  Popup,
  Segment,
} from "semantic-ui-react";

import styles from "./LauncherBadgeCreator.module.scss";
import { CodeSnippet, Title } from "~/components";
import { api, LAUNCH_ON_REANA_BADGE_URL } from "~/config";
import BasePage from "~/pages/BasePage";
import { stringifyQueryParams } from "~/util";
import { Link } from "react-router-dom";

const LauncherBadgeCreator = () => {
  const [launcherData, setLauncherData] = useState({
    url: "",
    analysisName: "",
    specFileName: "",
    parameters: [],
  });

  const [validationErrors, setValidationErrors] = useState({
    url: null,
    analysisName: null,
    specFileName: null,
    parameters: [],
  });

  const [launcherURL, setLauncherURL] = useState();

  const handleInputChange = (e, { name, value }) => {
    // Clear the validation errors relative to the field that has been changed
    setValidationErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    setLauncherData({ ...launcherData, [name]: value });
  };

  const handleAddParam = () => {
    setLauncherData((prevData) => ({
      ...prevData,
      parameters: [...prevData.parameters, { key: "", value: "" }],
    }));
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      parameters: [...prevErrors.parameters, { key: null, value: null }],
    }));
  };

  const handleDeleteParam = (index, paramKey) => {
    // Clear the validation error relative to the parameter that has been deleted
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      parameters: prevErrors.parameters.toSpliced(index, 1),
    }));
    setLauncherData((prevData) => {
      const newParameters = [...prevData.parameters];
      newParameters.splice(index, 1);
      return { ...prevData, parameters: newParameters };
    });
  };

  const handleParamChange = (index, key, value, paramKey) => {
    // Clear the validation errors relative to the parameter that has been changed
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      parameters: prevErrors.parameters.toSpliced(index, 1, {
        key: null,
        value: null,
      }),
    }));
    setLauncherData((prevData) => {
      const newParameters = [...prevData.parameters];
      newParameters[index] = { ...newParameters[index], [key]: value };
      return { ...prevData, parameters: newParameters };
    });
  };

  const handleSubmit = () => {
    let paramsString = null;
    let invalid = false;

    // Clear the parameter validation errors, to start with a clean slate
    // and avoid showing e.g. duplicate key errors if the first key has been changed
    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      parameters: prevErrors.parameters.map(() => ({
        key: null,
        value: null,
      })),
    }));

    // Validate URL
    try {
      new URL(launcherData.url);
    } catch (e) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        url: "Not a valid URL!",
      }));
      invalid = true;
    }

    // Validate analysis name
    if (launcherData.analysisName) {
      if (launcherData.analysisName.includes(".")) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          analysisName: "The analysis name cannot contain dots!",
        }));
        invalid = true;
      }
    }

    // Validate specification file name
    if (
      launcherData.specFileName &&
      !launcherData.specFileName.endsWith(".yaml") &&
      !launcherData.specFileName.endsWith(".yml")
    ) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        specFileName: "The specification file name must end with .yaml or .yml",
      }));
      invalid = true;
    }

    if (launcherData.parameters.length > 0) {
      // The value of each parameter is considered to be a JSON-encoded string.
      // In this way, the user can pass integers, lists, complex objects, etc.

      // Validate the value of each parameter (valid JSON string)
      let paramsObject = {};
      launcherData.parameters.forEach((param, index) => {
        if (paramsObject.hasOwnProperty(param.key)) {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            parameters: prevErrors.parameters.toSpliced(index, 1, {
              key: "The keys cannot be duplicate!",
              value: prevErrors.parameters[index].value,
            }),
          }));
          invalid = true;
        }
        if (param.key.trim() === "") {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            parameters: prevErrors.parameters.toSpliced(index, 1, {
              key: "The keys cannot be empty!",
              value: prevErrors.parameters[index].value,
            }),
          }));
          invalid = true;
        }
        try {
          paramsObject[param.key] = JSON.parse(param.value);
          paramsString = JSON.stringify(paramsObject);
        } catch (e) {
          setValidationErrors((prevErrors) => ({
            ...prevErrors,
            parameters: prevErrors.parameters.toSpliced(index, 1, {
              key: prevErrors.parameters[index].key,
              value: "Not a valid JSON string!",
            }),
          }));
          invalid = true;
        }
      });
    }

    // If there are validation errors, abort
    if (invalid) {
      setLauncherURL(null);
      return;
    }
    setLauncherURL(
      `${api}/launch?${stringifyQueryParams({
        url: launcherData.url,
        name: launcherData.analysisName,
        specification: launcherData.specFileName,
        parameters: paramsString,
      })}`,
    );
  };

  return (
    <BasePage title="Launcher badge creator">
      <Container text className={styles["container"]}>
        <Title>Create your own "Launch on REANA" badge</Title>
        <p>
          Fill in the form below to generate the URL to the REANA launcher that
          will run your analysis, as well as the markdown code for a "Launch on
          REANA" badge that you can include in your GitHub repositories!
        </p>
        <Segment className={styles.segment}>
          <Form onSubmit={handleSubmit}>
            <Form.Group widths="equal">
              <Form.Input
                id="url"
                label="URL of the workflow repository"
                name="url"
                onChange={handleInputChange}
                required
                error={validationErrors.url}
                fluid
              />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input
                id="analysisName"
                label="Analysis name"
                name="analysisName"
                onChange={handleInputChange}
                error={validationErrors.analysisName}
                fluid
              />
              <Form.Input
                id="specFileName"
                label="REANA specification filename"
                placeholder="reana.yaml"
                name="specFileName"
                onChange={handleInputChange}
                error={validationErrors.specFileName}
                fluid
              />
            </Form.Group>
            <div className={styles["parameters-header"]}>
              <label className={styles.label}>
                Parameters{" "}
                <Popup
                  trigger={<Icon name="info circle" />}
                  content={
                    "For each parameter, insert the value as a JSON-encoded string. " +
                    "For example, if you want to pass an integer, you can write 1, " +
                    'but if you want to pass a list of strings, you need to write ["a", "b", "c"].'
                  }
                />
              </label>
              <Button type="button" onClick={handleAddParam}>
                <Icon name="plus" /> Add Parameter
              </Button>
            </div>
            {launcherData.parameters.map((param, index) => (
              <Form.Group key={index} className={styles["parameter-row"]}>
                <Form.Input
                  id={`key-${index}`}
                  width={5}
                  placeholder="Key"
                  name="key"
                  value={param.key}
                  onChange={(e) =>
                    handleParamChange(index, "key", e.target.value)
                  }
                  error={validationErrors.parameters[index].key}
                />
                <Form.Input
                  id={`value-${index}`}
                  width={10}
                  placeholder="Value"
                  name="value"
                  value={param.value}
                  onChange={(e) =>
                    handleParamChange(index, "value", e.target.value, param.key)
                  }
                  error={validationErrors.parameters[index].value}
                />
                <Form.Button
                  type="button"
                  width={1}
                  icon="delete"
                  onClick={() => handleDeleteParam(index, param.key)}
                />
              </Form.Group>
            ))}
            <Button primary fluid type="submit">
              Create badge!
            </Button>
          </Form>
          {!!launcherURL && (
            <>
              <Divider></Divider>
              <p>
                Here you can find the URL you can use to launch the workflow:
              </p>
              <CodeSnippet dollarPrefix={false} copy>
                <div>{launcherURL}</div>
              </CodeSnippet>
              <p>
                And here is the Markdown code for your badge:
                <Link to={launcherURL}>
                  <img src={LAUNCH_ON_REANA_BADGE_URL} alt="Launch on REANA" />
                </Link>
              </p>
              <CodeSnippet dollarPrefix={false} copy>
                <div>
                  [![Launch on REANA]({LAUNCH_ON_REANA_BADGE_URL})](
                  {launcherURL})
                </div>
              </CodeSnippet>
            </>
          )}
        </Segment>
      </Container>
    </BasePage>
  );
};

export default LauncherBadgeCreator;
