/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Form,
  FormDropdown,
  FormGroup,
  FormInput,
  FormRadio,
  Modal,
} from "semantic-ui-react";

import {
  closeInteractiveSessionModal,
  openInteractiveSession,
} from "~/actions";
import {
  getConfig,
  getInteractiveSessionModalItem,
  getInteractiveSessionModalOpen,
} from "~/selectors";

const EnvironmentType = {
  Recommended: "recommended",
  Custom: "custom",
};

export default function InteractiveSessionModal() {
  const dispatch = useDispatch();
  const open = useSelector(getInteractiveSessionModalOpen);
  const workflow = useSelector(getInteractiveSessionModalItem);

  const config = useSelector(getConfig);
  const environments = config.interactiveSessions.environments;
  const allSessionTypes = useMemo(
    () => Object.keys(environments).sort(),
    [environments],
  );

  const [sessionType, setSessionType] = useState(null);
  const [environmentType, setEnvironmentType] = useState(
    EnvironmentType.Recommended,
  );
  const [recommendedImage, setRecommendedImage] = useState(null);
  const [customImage, setCustomImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const resetForm = useCallback(
    (newSessionType = null) => {
      if (!newSessionType) {
        // get default session type
        newSessionType = allSessionTypes.at(0);
      }

      if (newSessionType) {
        setSessionType(newSessionType);
        if (environments[newSessionType].recommended.length > 0) {
          setEnvironmentType(EnvironmentType.Recommended);
        } else {
          setEnvironmentType(EnvironmentType.Custom);
        }
        // default image is first of recommended
        setRecommendedImage(
          environments[newSessionType].recommended.at(0)?.image ?? "",
        );
        setCustomImage("");
        setIsLoading(false);
        setErrors({});
      }
    },
    [environments, allSessionTypes],
  );

  useEffect(() => {
    // reset local state on workflow change
    resetForm();
  }, [workflow, resetForm]);

  // no workflow passed, nothing to show
  if (!workflow) return null;

  if (allSessionTypes.length > 0 && !sessionType) {
    // initialize state
    resetForm();
    return null;
  }

  const onCloseModal = () => {
    resetForm();
    dispatch(closeInteractiveSessionModal());
  };

  if (allSessionTypes.length === 0) {
    return (
      <Modal open={open} onClose={onCloseModal} closeIcon size="small">
        <Modal.Header>Open interactive session</Modal.Header>
        <Modal.Content>
          There aren't any available interactive session types.
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onCloseModal}>Cancel</Button>
        </Modal.Actions>
      </Modal>
    );
  }

  const sessionTypeOptions = allSessionTypes.map((type) => ({
    key: type,
    text: type,
    value: type,
  }));

  const recommendedImageOptions = environments[sessionType].recommended.map(
    (recommended) => ({
      key: recommended.image,
      text: recommended.name ?? recommended.image,
      value: recommended.image,
    }),
  );

  const isCustomAllowed = environments[sessionType].allowCustom;

  const checkFields = () => {
    const errors = {};
    if (environmentType === EnvironmentType.Custom && !customImage) {
      errors.customImage = "Please provide a custom image";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = () => {
    if (!checkFields()) return;

    setIsLoading(true);

    const image =
      environmentType === EnvironmentType.Recommended
        ? recommendedImage
        : customImage;
    dispatch(
      openInteractiveSession(workflow.id, { type: sessionType, image }),
    ).finally(onCloseModal);
  };

  return (
    <Modal open={open} onClose={onCloseModal} closeIcon size="small">
      <Modal.Header>Open interactive session</Modal.Header>
      <Modal.Content>
        <Form id="formOpenSession" onSubmit={onSubmit} loading={isLoading}>
          {/* only show dropdown if there are at least two session types to choose from */}
          {allSessionTypes.length > 1 && (
            <FormDropdown
              selection
              label="Session type"
              options={sessionTypeOptions}
              value={sessionType}
              onChange={(_, { value }) => resetForm(value)}
              disabled={sessionTypeOptions.length === 1}
            />
          )}
          {/* show selector if both recommended and custom images are allowed */}
          {recommendedImageOptions.length > 0 && isCustomAllowed && (
            <FormGroup inline>
              <label>Environment</label>
              <FormRadio
                name="environmentType"
                label="Recommended environments"
                value="recommended"
                checked={environmentType === EnvironmentType.Recommended}
                onChange={(_, { value }) => setEnvironmentType(value)}
              />
              <FormRadio
                name="environmentType"
                label="Custom environment"
                value="custom"
                checked={environmentType === EnvironmentType.Custom}
                onChange={(_, { value }) => setEnvironmentType(value)}
              />
            </FormGroup>
          )}
          {/* no recommended images and no custom images allowed, nothing can be chosen */}
          {recommendedImageOptions.length === 0 && !isCustomAllowed && (
            <p>There aren't any allowed environment images.</p>
          )}
          {environmentType === EnvironmentType.Recommended && (
            <FormDropdown
              selection
              label="Recommended environments"
              options={recommendedImageOptions}
              value={recommendedImage}
              onChange={(_, { value }) => setRecommendedImage(value)}
              search={true}
            />
          )}
          {isCustomAllowed && environmentType === EnvironmentType.Custom && (
            <FormInput
              label="Custom environment"
              value={customImage}
              onChange={(_, { value }) => setCustomImage(value)}
              placeholder={"Custom container image"}
              error={errors.customImage}
            />
          )}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        {(recommendedImageOptions.length > 0 || isCustomAllowed) && (
          <Button primary type="submit" form="formOpenSession">
            Open
          </Button>
        )}
        <Button onClick={onCloseModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
