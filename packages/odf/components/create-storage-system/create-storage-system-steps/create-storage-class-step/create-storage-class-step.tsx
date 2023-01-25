import * as React from 'react';
import { getExternalStorage } from '@odf/core/components/utils';
import { ExternalStateValues, ExternalStateKeys } from '@odf/core/types';
import { useK8sList } from '@odf/shared/hooks/useK8sList';
import {
  TextInputWithFieldRequirements,
  useYupValidationResolver,
} from '@odf/shared/input-with-requirements';
import { StorageClassModel } from '@odf/shared/models';
import { getName } from '@odf/shared/selectors';
import { StorageSystemKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import { Form, TextContent, TextVariants, Text } from '@patternfly/react-core';
import { WizardDispatch, WizardState } from '../../reducer';
import './create-storage-class-step.scss';

export const CreateStorageClass: React.FC<CreateStorageClassProps> = ({
  state,
  storageClass,
  externalStorage,
  dispatch,
}) => {
  const { t } = useCustomTranslation();

  const { Component, displayName } = getExternalStorage(externalStorage) || {
    Component: null,
    displayName: '',
  };

  const setForm = React.useCallback(
    (field: ExternalStateKeys, value: ExternalStateValues) =>
      dispatch({
        type: 'wizard/setCreateStorageClass',
        payload: {
          field,
          value,
        },
      }),
    [dispatch]
  );

  const [existingNames, setExistingNames] = React.useState<string[]>([]);

  const [data, loaded, loadError] =
    useK8sList<StorageSystemKind>(StorageClassModel);
  React.useEffect(() => {
    if (loaded) {
      const names = data?.map((data: StorageSystemKind) => getName(data));
      setExistingNames(names);
    }
    if (loadError) setExistingNames([]);
  }, [data, loaded, loadError]);

  const fieldRequirements = [
    t('No more than 253 characters'),
    t('Starts and ends with a lowercase letter or number'),
    t('Only lowercase letters, numbers, non-consecutive periods, or hyphens'),
    t('Cannot be used before'),
  ];

  const schema = Yup.object({
    ['storage-class-name']: Yup.string()
      .required()
      .max(253, fieldRequirements[0])
      .matches(
        /^(?![-.])([a-z0-9]|[-.]*([a-z0-9]))+(?![-.])$/,
        fieldRequirements[1]
      )
      .matches(
        /^[a-z0-9]+([a-z0-9]|([-.](?![-.])))*[a-z0-9]*$/,
        fieldRequirements[2]
      )
      .test(
        'unique-name',
        fieldRequirements[3],
        (value: string) => !!!existingNames.includes(value)
      ),
  });
  const resolver = useYupValidationResolver(schema);
  const {
    control,
    watch,
    formState: { isValid },
  } = useForm({
    mode: 'all',
    reValidateMode: 'onChange',
    resolver: resolver,
    context: undefined,
    criteriaMode: 'firstError',
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: undefined,
  });

  const poolName = watch('storage-class-name');

  React.useEffect(() => {
    dispatch({
      type: 'wizard/setStorageClass',
      payload: {
        name: isValid ? poolName : undefined,
      },
    });
  }, [poolName, dispatch, isValid]);

  return (
    <Form className="odf-create-storage-class__form">
      <TextInputWithFieldRequirements
        control={control}
        fieldRequirements={fieldRequirements}
        defaultValue={storageClass.name}
        formGroupProps={{
          label: t('StorageClass name'),
          fieldId: 'storage-class-name',
        }}
        textInputProps={{
          id: 'storage-class-name',
          name: 'storage-class-name',
          ['data-test']: 'storage-class-name',
        }}
      />
      <TextContent>
        <Text component={TextVariants.h4}>
          {t('{{displayName}} connection details', { displayName })}
        </Text>
      </TextContent>
      {Component && <Component setFormState={setForm} formState={state} />}
    </Form>
  );
};

type CreateStorageClassProps = {
  state: WizardState['createStorageClass'];
  externalStorage: WizardState['backingStorage']['externalStorage'];
  storageClass: WizardState['storageClass'];
  dispatch: WizardDispatch;
};
