/*
  -*- coding: utf-8 -*-

  This file is part of REANA.
  Copyright (C) 2024 CERN.

  REANA is free software; you can redistribute it and/or modify it
  under the terms of the MIT License; see LICENSE file for more details.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  FormDropdown,
  FormGroup,
  FormInput,
  FormRadio,
  Modal,
} from "semantic-ui-react";

import { useNotification } from "~/NotificationContext";
import { useGetConfig } from "~/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import client from "~/client";
import { ParsedWorkflow } from "~/util";

const EnvironmentType = {
  Recommended: "recommended",
  Custom: "custom",
} as const;
type EnvironmentTypeValue =
  (typeof EnvironmentType)[keyof typeof EnvironmentType];

interface Props {
  workflow: ParsedWorkflow;
  isOpen: boolean;
  onClose: () => void;
}

export default function InteractiveSessionModal({
  workflow,
  isOpen,
  onClose,
}: Props) {
  const { notify, notifyError } = useNotification();
  const queryClient = useQueryClient();
  const config = useGetConfig().data ?? ({} as any);
  const environments: any = config.interactiveSessions?.environments ?? {};
  const allSessionTypes: string[] = useMemo(
    () => Object.keys(environments).sort(),
    [environments],
  );

  const [sessionType, setSessionType] = useState<string | null>(null);
  const [environmentType, setEnvironmentType] = useState<EnvironmentTypeValue>(
    EnvironmentType.Recommended,
  );
  const [recommendedImage, setRecommendedImage] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(
    (newSessionType: string | null | undefined = null): void => {
      if (!newSessionType) {
        // get default session type
        newSessionType = allSessionTypes[0];
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
          environments[newSessionType].recommended[0]?.image ?? "",
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

  if (allSessionTypes.length > 0 && !sessionType) {
    // initialize state
    resetForm();
    return null;
  }

  const onCloseModal = () => {
    resetForm();
    onClose();
  };

  if (allSessionTypes.length === 0) {
    return (
      <Modal open={isOpen} onClose={onCloseModal} closeIcon size="small">
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

  const sessionTypeOptions: Array<{
    key: string;
    text: string;
    value: string;
  }> = allSessionTypes.map((type) => ({
    key: type,
    text: type,
    value: type,
  }));

  const recommendedImageOptions: Array<{
    key: string;
    text: string;
    value: string;
  }> = environments[sessionType].recommended.map((recommended: any) => ({
    key: recommended.image,
    text: recommended.name ?? recommended.image,
    value: recommended.image,
  }));

  const isCustomAllowed = environments[sessionType].allowCustom;

  const checkFields = () => {
    const errors: Record<string, string> = {};
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
    const inactivityPeriod = (config as any)
      ?.maxInteractiveSessionInactivityPeriod;
    const inactivityWarning = inactivityPeriod
      ? `Please note that it will be automatically closed after ${inactivityPeriod} days of inactivity.`
      : "";

    client
      .openInteractiveSession(workflow.id, {
        type: sessionType ?? undefined,
        image: image ?? undefined,
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
        notify(
          "Success!",
          "The interactive session has been created. " +
            "However, it could take several minutes to start the Jupyter Notebook. " +
            "Click on the Jupyter notebook badge to access it. " +
            inactivityWarning,
        );
      })
      .catch((err) => {
        notifyError(err);
      })
      .finally(onCloseModal);
  };

  return (
    <Modal open={isOpen} onClose={onCloseModal} closeIcon size="small">
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
              onChange={(_, { value }) => resetForm(value as string)}
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
                onChange={(_, { value }) =>
                  setEnvironmentType(value as EnvironmentTypeValue)
                }
              />
              <FormRadio
                name="environmentType"
                label="Custom environment"
                value="custom"
                checked={environmentType === EnvironmentType.Custom}
                onChange={(_, { value }) =>
                  setEnvironmentType(value as EnvironmentTypeValue)
                }
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
              onChange={(_, { value }) => setRecommendedImage(value as string)}
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
