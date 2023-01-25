import * as React from 'react';
import { getStorageClassDescription } from '@odf/core/utils';
import ResourceDropdown from '@odf/shared/dropdown/ResourceDropdown';
import ResourcesDropdown from '@odf/shared/dropdown/ResourceDropdown';
import { ButtonBar } from '@odf/shared/generic/ButtonBar';
import { useK8sList } from '@odf/shared/hooks/useK8sList';
import {
  TextInputWithFieldRequirements,
  useYupValidationResolver,
} from '@odf/shared/input-with-requirements';
import { StorageClassModel } from '@odf/shared/models';
import { getName } from '@odf/shared/selectors';
import { K8sResourceKind, StorageClassResourceKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { referenceForModel, resourcePathFromModel } from '@odf/shared/utils';
import {
  getAPIVersionForModel,
  k8sCreate,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { match, useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import { ActionGroup, Button } from '@patternfly/react-core';
import {
  NooBaaObjectBucketClaimModel,
  NooBaaBucketClassModel,
} from '../../models';
import { Action, commonReducer, defaultState, State } from './state';
import './create-obc.scss';
import '../../style.scss';

type CreateOBCFormProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  namespace?: string;
};

export const NB_PROVISIONER = 'noobaa.io/obc';

const objectStorageProvisioners = [
  'openshift-storage.noobaa.io/obc',
  'openshift-storage.ceph.rook.io/bucket',
];

export const isObjectSC = (sc: StorageClassResourceKind) =>
  objectStorageProvisioners.includes(_.get(sc, 'provisioner'));

export const CreateOBCForm: React.FC<CreateOBCFormProps> = (props) => {
  const { t } = useCustomTranslation();
  const { state, dispatch, namespace } = props;
  const isNoobaa = state.scProvisioner?.includes(NB_PROVISIONER);

  const onScChange = React.useCallback(
    (sc) => {
      dispatch({ type: 'setStorage', name: getName(sc) });
      dispatch({ type: 'setProvisioner', name: sc?.provisioner });
    },
    [dispatch]
  );

  const [existingNames, setExistingNames] = React.useState<string[]>([]);

  const [data, loaded, loadError] = useK8sList(
    NooBaaObjectBucketClaimModel,
    namespace
  );
  React.useEffect(() => {
    if (loaded) {
      const names = data?.map((data) => getName(data));
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
    obcName: Yup.string()
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

  const obcName = watch('obcName');

  React.useEffect(() => {
    onScChange(isValid ? obcName : undefined);
  }, [obcName, onScChange, isValid]);

  React.useEffect(() => {
    const obj: K8sResourceKind = {
      apiVersion: getAPIVersionForModel(NooBaaObjectBucketClaimModel),
      kind: NooBaaObjectBucketClaimModel.kind,
      metadata: {
        namespace,
      },
      spec: {
        ssl: false,
      },
    };
    if (state.scName) {
      obj.spec.storageClassName = state.scName;
    }
    if (state.name) {
      obj.metadata.name = state.name;
      obj.spec.generateBucketName = state.name;
    } else {
      obj.metadata.generateName = 'bucketclaim-';
      obj.spec.generateBucketName = 'bucket-';
    }
    if (state.bucketClass && isNoobaa) {
      obj.spec.additionalConfig = { bucketclass: state.bucketClass };
    }
    dispatch({ type: 'setPayload', payload: obj });
  }, [
    namespace,
    state.name,
    state.scName,
    state.bucketClass,
    isNoobaa,
    dispatch,
  ]);

  const storageClassResource = {
    kind: StorageClassModel.kind,
    namespaced: false,
    isList: true,
  };

  const bucketClassResource = {
    kind: referenceForModel(NooBaaBucketClassModel),
    namespaced: true,
    isList: true,
    namespace: 'openshift-storage',
  };

  return (
    <div>
      <TextInputWithFieldRequirements
        control={control}
        fieldRequirements={fieldRequirements}
        formGroupProps={{
          label: t('ObjectBucketClaim Name'),
          fieldId: 'obc-name',
          className: 'control-label',
          helperText: t('If not provided a generic name will be generated.'),
        }}
        textInputProps={{
          id: 'obc-name',
          name: 'obcName',
          className: 'pf-c-form-control',
          type: 'text',
          placeholder: t('my-object-bucket'),
          ['aria-describedby']: 'obc-name-help',
          ['data-test']: 'obc-name',
        }}
      />
      <div className="form-group">
        <label className="control-label" htmlFor="sc-dropdown">
          {t('StorageClass')}
        </label>
        <div className="form-group">
          <ResourcesDropdown<StorageClassResourceKind>
            resourceModel={StorageClassModel}
            onSelect={(res) => onScChange(res)}
            filterResource={isObjectSC}
            className="odf-mcg__resource-dropdown"
            id="sc-dropdown"
            data-test="sc-dropdown"
            resource={storageClassResource}
            secondaryTextGenerator={getStorageClassDescription}
          />
          <p className="help-block">
            {t('Defines the object-store service and the bucket provisioner.')}
          </p>
        </div>
      </div>
      {isNoobaa && (
        <div className="form-group">
          <label className="control-label odf-required" htmlFor="obc-name">
            {t('BucketClass')}
          </label>
          <div className="form-group">
            <ResourceDropdown<K8sResourceKind>
              onSelect={(sc) =>
                dispatch({ type: 'setBucketClass', name: sc.metadata?.name })
              }
              className="odf-mcg__resource-dropdown"
              initialSelection={(resources) =>
                resources.find(
                  (res) => res.metadata.name === 'noobaa-default-bucket-class'
                )
              }
              id="bc-dropdown"
              data-test="bc-dropdown"
              resource={bucketClassResource}
              resourceModel={NooBaaBucketClassModel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const CreateOBCPage: React.FC<CreateOBCPageProps> = (props) => {
  const { t } = useCustomTranslation();
  const [state, dispatch] = React.useReducer(commonReducer, defaultState);
  const namespace = props.match.params.ns;

  const history = useHistory();

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    dispatch({ type: 'setProgress' });
    k8sCreate<K8sResourceKind>({
      model: NooBaaObjectBucketClaimModel,
      data: state.payload,
    })
      .then((resource) => {
        dispatch({ type: 'unsetProgress' });

        history.push(
          `${resourcePathFromModel(
            NooBaaObjectBucketClaimModel,
            resource.metadata.name,
            resource.metadata.namespace
          )}`
        );
      })
      .catch((err) => {
        dispatch({ type: 'setError', message: err.message });
        dispatch({ type: 'unsetProgress' });
      });
  };

  return (
    <div className="odf-m-pane__body odf-m-pane__form">
      <Helmet>
        <title>{t('Create ObjectBucketClaim')}</title>
      </Helmet>
      <h1 className="odf-m-pane__heading odf-m-pane__heading--baseline">
        <div>{t('Create ObjectBucketClaim')}</div>
        <div className="odf-m-pane__heading--link">
          <Link
            to={`${resourcePathFromModel(
              NooBaaObjectBucketClaimModel,
              null,
              namespace
            )}/~new`}
            replace
          >
            {t('Edit YAML')}
          </Link>
        </div>
      </h1>
      <form className="odf-m-pane__body-group" onSubmit={save}>
        <CreateOBCForm
          state={state}
          dispatch={dispatch}
          namespace={namespace}
        />
        <ButtonBar errorMessage={state.error} inProgress={state.progress}>
          <ActionGroup className="pf-c-form">
            <Button type="submit" variant="primary" data-test="obc-create">
              {t('Create')}
            </Button>
            <Button onClick={history.goBack} type="button" variant="secondary">
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

type CreateOBCPageProps = {
  match: match<{ ns?: string }>;
};
