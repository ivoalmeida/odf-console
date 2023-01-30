import * as React from 'react';
import { useK8sList } from '@odf/shared/hooks/useK8sList';
import {
  TextInputWithFieldRequirements,
  useYupValidationResolver,
} from '@odf/shared/input-with-requirements';
import { getName } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import {
  Alert,
  AlertActionCloseButton,
  Form,
  FormGroup,
  Radio,
  TextArea,
} from '@patternfly/react-core';
import { FEATURES } from '../../../features';
import { NooBaaBucketClassModel } from '../../../models';
import { BucketClassKind, BucketClassType } from '../../../types';
import { ExternalLink } from '../../mcg-endpoints/gcp-endpoint-type';
import { Action, State } from '../state';
import '../create-bc.scss';

export const bucketClassTypeRadios = (t: TFunction) => [
  {
    id: BucketClassType.STANDARD,
    value: BucketClassType.STANDARD,
    label: t('Standard'),
    description: t(
      'Data will be consumed by a Multi-cloud object gateway, deduped, compressed, and encrypted. The encrypted chunks would be saved on the selected BackingStores. Best used when the applications would always use the Data Foundation endpoints to access the data.'
    ),
  },
  {
    id: BucketClassType.NAMESPACE,
    value: BucketClassType.NAMESPACE,
    label: t('Namespace'),
    description: t(
      'Data is stored on the NamespaceStores without performing de-duplication, compression, or encryption. BucketClasses of namespace type allow connecting to existing data and serving from them. These are best used for existing data or when other applications (and cloud-native services) need to access the data from outside Data Foundation.'
    ),
  },
];

const GeneralPage: React.FC<GeneralPageProps> = ({ dispatch, state }) => {
  const { t } = useCustomTranslation();

  const [showHelp, setShowHelp] = React.useState(true);

  const isNamespaceStoreSupported = useFlag(FEATURES.OCS_NAMESPACE_STORE);

  const [existingNames, setExistingNames] = React.useState<string[]>([]);

  const [data, loaded, loadError] = useK8sList<BucketClassKind>(
    NooBaaBucketClassModel
  );

  React.useEffect(() => {
    if (loaded) {
      const names = data.map((data: BucketClassKind) => getName(data));
      setExistingNames(names);
    }
    if (loadError) setExistingNames([]);
  }, [data, loaded, loadError]);

  const fieldRequirements = [
    t('3-63 characters'),
    t('Starts and ends with a lowercase letter or number'),
    t('Only lowercase letters, numbers, non-consecutive periods, or hyphens'),
    t('Globally unique name'),
  ];

  const schema = Yup.object({
    ['bucketclassname-input']: Yup.string()
      .required()
      .min(3, fieldRequirements[0])
      .max(63, fieldRequirements[0])
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
    formState: { isValid },
    watch,
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

  const bucketClassName = watch('bucketclassname-input');

  React.useEffect(() => {
    dispatch({
      type: 'setBucketClassName',
      name: isValid ? bucketClassName : '',
    });
  }, [bucketClassName, dispatch, isValid]);

  return (
    <div className="nb-create-bc-step-page">
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title={t('What is a BucketClass?')}
          className="nb-create-bc-step-page__info"
          actionClose={
            <AlertActionCloseButton onClose={() => setShowHelp(false)} />
          }
        >
          <p>
            {t(
              'A set of policies which would apply to all buckets (OBCs) created with the specific bucket class. These policies include placement, namespace and caching'
            )}
          </p>
          <ExternalLink
            href="https://github.com/noobaa/noobaa-operator/blob/master/doc/bucket-class-crd.md"
            text={t('Learn More')}
          />
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        {isNamespaceStoreSupported && (
          <FormGroup
            fieldId="bucketclasstype-radio"
            className="nb-create-bc-step-page-form__element nb-bucket-class-type-form__element"
            isRequired
            label={t('BucketClass type')}
          >
            {bucketClassTypeRadios(t).map((radio) => {
              const checked = radio.value === state.bucketClassType;
              return (
                <Radio
                  key={radio.id}
                  {...radio}
                  data-test={`${radio.value.toLowerCase()}-radio`}
                  onChange={() => {
                    dispatch({
                      type: 'setBucketClassType',
                      value: radio.value,
                    });
                  }}
                  checked={checked}
                  className="nb-create-bc-step-page-form__radio"
                  name="bucketclasstype"
                />
              );
            })}
          </FormGroup>
        )}

        <TextInputWithFieldRequirements
          control={control}
          fieldRequirements={fieldRequirements}
          popoverProps={{ headerContent: t('Name requirements') }}
          formGroupProps={{
            className: 'nb-create-bc-step-page-form__element',
            fieldId: 'bucketclassname-input',
            label: t('BucketClass name'),
            helperText: t(
              'A unique name for the bucket class within the project.'
            ),
            isRequired: true,
          }}
          textInputProps={{
            name: 'bucketclassname-input',
            ['data-test']: 'bucket-class-name',
            placeholder: t('my-multi-cloud-mirror'),
            type: 'text',
            id: 'bucketclassname-input',
            value: state.bucketClassName,
            ['aria-label']: t('BucketClass Name'),
          }}
        />
        <FormGroup
          className="nb-create-bc-step-page-form__element"
          fieldId="bc-description"
          label={t('Description (Optional)')}
        >
          <TextArea
            data-test="bucket-class-description"
            id="bc-description"
            value={state.description}
            onChange={(data) =>
              dispatch({ type: 'setDescription', value: data })
            }
            aria-label={t('Description of bucket class')}
          />
        </FormGroup>
      </Form>
    </div>
  );
};

export default GeneralPage;

type GeneralPageProps = {
  dispatch: React.Dispatch<Action>;
  state: State;
};
