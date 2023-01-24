import * as React from 'react';
import { checkArbiterCluster } from '@odf/core/utils';
import { useK8sGet } from '@odf/shared/hooks/k8s-get-hook';
import { useK8sList } from '@odf/shared/hooks/useK8sList';
import {
  TextInputWithFieldRequirements,
  useYupValidationResolver,
} from '@odf/shared/input-with-requirements';
import { getName } from '@odf/shared/selectors';
import {
  ListKind,
  StorageClusterKind,
  CephClusterKind,
} from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';
import {
  Alert,
  Dropdown,
  DropdownToggle,
  DropdownItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import {
  CEPH_NS,
  OCS_DEVICE_REPLICA,
  OCS_POOL_MANAGEMENT,
  POOL_PROGRESS,
  POOL_STATE,
} from '../constants';
import { StorageClusterModel, CephBlockPoolModel } from '../models';
import {
  getErrorMessage,
  ProgressStatusProps,
  PROGRESS_STATUS,
} from '../utils';
import {
  BlockPoolAction,
  BlockPoolActionType,
  BlockPoolState,
} from './reducer';
import './body.scss';

export const BlockPoolStatus: React.FC<BlockPoolStatusProps> = ({
  status,
  name,
  error = '',
}) => {
  const { t } = useCustomTranslation();
  const statusObj: ProgressStatusProps = PROGRESS_STATUS(t, name).find(
    (state) => state.name === status
  );

  return (
    <EmptyState>
      <EmptyStateIcon icon={statusObj.icon} className={statusObj.className} />
      <EmptyStateBody data-test="empty-state-body">
        {error ? getErrorMessage(error) : statusObj.desc}
      </EmptyStateBody>
    </EmptyState>
  );
};

export type BlockPoolStatusProps = {
  status: string;
  name?: string;
  error?: string;
};

export const BlockPoolBody = (props: BlockPoolBodyPros) => {
  const { cephCluster, state, dispatch, showPoolStatus, isUpdate } = props;
  const { t } = useCustomTranslation();

  const isPoolManagementSupported = useFlag(OCS_POOL_MANAGEMENT);
  const [storageCluster, storageClusterLoaded, storageClusterLoadError] =
    useK8sGet<ListKind<StorageClusterKind>>(StorageClusterModel, null, CEPH_NS);

  const [isReplicaOpen, setReplicaOpen] = React.useState(false);
  const [isVolumeTypeOpen, setVolumeTypeOpen] = React.useState(false);
  const [availableDeviceClasses, setAvailableDeviceClasses] = React.useState(
    []
  );

  const [existingNames, setExistingNames] = React.useState<string[]>([]);

  const [data, loaded, loadError] = useK8sList(
    CephBlockPoolModel,
    'openshift-storage'
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
    newPoolName: Yup.string()
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

  const poolName = watch('newPoolName');

  React.useEffect(() => {
    dispatch({
      type: BlockPoolActionType.SET_POOL_NAME,
      payload: isValid ? poolName : undefined,
    });
  }, [poolName, dispatch, isValid]);

  // Failure Domain
  React.useEffect(() => {
    if (storageClusterLoaded && !storageClusterLoadError)
      dispatch({
        type: BlockPoolActionType.SET_FAILURE_DOMAIN,
        payload: storageCluster?.items[0]?.status?.failureDomain || '',
      });
  }, [storageCluster, storageClusterLoaded, storageClusterLoadError, dispatch]);

  // Volume Type
  const deviceClasses = React.useMemo(
    () => cephCluster?.status?.storage?.deviceClasses ?? [],
    [cephCluster?.status?.storage?.deviceClasses]
  );

  const setVolumeType = React.useCallback(
    (volumeType: string) =>
      dispatch({
        type: BlockPoolActionType.SET_POOL_VOLUME_TYPE,
        payload: volumeType,
      }),
    [dispatch]
  );

  React.useEffect(() => {
    if (deviceClasses.length && isPoolManagementSupported) {
      if (state.volumeType === '') {
        // Set default value
        const ssdDeviceClass =
          deviceClasses.find((deviceClass) => deviceClass.name === 'ssd') || {};
        Object.keys(ssdDeviceClass).length
          ? setVolumeType('ssd')
          : setVolumeType(deviceClasses[0].name);
      }

      // Volume Type dropdown
      setAvailableDeviceClasses(
        deviceClasses.map((device) => {
          return (
            <DropdownItem
              key={`device-${device?.name}`}
              component="button"
              id={device?.name}
              data-test="volume-type-dropdown-item"
              onClick={(e) => setVolumeType(e.currentTarget.id)}
            >
              {device?.name.toUpperCase()}
            </DropdownItem>
          );
        })
      );
    }
  }, [
    deviceClasses,
    dispatch,
    isPoolManagementSupported,
    setVolumeType,
    state.volumeType,
  ]);

  // Check storage cluster is in ready state
  const isClusterReady: boolean =
    cephCluster?.status?.phase === POOL_STATE.READY;

  // Check storage cluster is arbiter
  React.useEffect(() => {
    const isArbiterCluster: boolean = checkArbiterCluster(
      storageCluster?.items[0]
    );
    dispatch({
      type: BlockPoolActionType.SET_POOL_ARBITER,
      payload: isArbiterCluster,
    });
    if (isArbiterCluster) {
      dispatch({
        type: BlockPoolActionType.SET_POOL_REPLICA_SIZE,
        payload: '4',
      });
    }
  }, [
    storageCluster,
    storageClusterLoaded,
    storageClusterLoadError,
    state.isArbiterCluster,
    dispatch,
  ]);

  const replicaList: string[] = _.keys(OCS_DEVICE_REPLICA).filter(
    (replica: string) =>
      (state.isArbiterCluster && replica === '4') ||
      (!state.isArbiterCluster && replica !== '4')
  );

  const replicaDropdownItems = replicaList.map((replica) => {
    let warning = '';
    if (replica === '2') {
      warning = t(
        'Data loss may occur, only recommended for small clusters or when backups are available or data loss is acceptable'
      );
    }
    return (
      <DropdownItem
        key={`replica-${OCS_DEVICE_REPLICA[replica]}`}
        component="button"
        id={replica}
        data-test-id="replica-dropdown-item"
        description={warning}
        onClick={(e) =>
          dispatch({
            type: BlockPoolActionType.SET_POOL_REPLICA_SIZE,
            payload: e.currentTarget.id,
          })
        }
      >
        {t('{{replica}} Replication', {
          replica: OCS_DEVICE_REPLICA[replica],
        })}
      </DropdownItem>
    );
  });

  return (
    <>
      {isClusterReady || !showPoolStatus ? (
        <>
          <TextInputWithFieldRequirements
            control={control}
            fieldRequirements={fieldRequirements}
            formGroupProps={{
              label: t('Pool name'),
              fieldId: 'pool-name',
              className: 'ceph-block-pool-body__input',
              isRequired: true,
            }}
            textInputProps={{
              id: 'pool-name',
              name: 'newPoolName',
              ['data-test']: 'new-pool-name-textbox',
              ['aria-describedby']: t('pool-name-help'),
              placeholder: t('my-block-pool'),
              disabled: isUpdate,
            }}
          />
          <div className="form-group ceph-block-pool-body__input">
            <label
              className="control-label co-required"
              htmlFor="pool-replica-size"
            >
              {t('Data protection policy')}
            </label>
            <Dropdown
              className="dropdown--full-width"
              toggle={
                <DropdownToggle
                  id="replica-dropdown"
                  data-test="replica-dropdown"
                  onToggle={() => setReplicaOpen(!isReplicaOpen)}
                  toggleIndicator={CaretDownIcon}
                  isDisabled={state.isArbiterCluster}
                >
                  {state.replicaSize
                    ? t('{{replica}} Replication', {
                        replica: OCS_DEVICE_REPLICA[state.replicaSize],
                      })
                    : t('Select replication')}
                </DropdownToggle>
              }
              isOpen={isReplicaOpen}
              dropdownItems={replicaDropdownItems}
              onSelect={() => setReplicaOpen(false)}
              id="pool-replica-size"
            />
          </div>
          {isPoolManagementSupported && (
            <div className="form-group ceph-block-pool-body__input">
              <label
                className="control-label co-required"
                htmlFor="pool-volume-type"
              >
                {t('Volume type')}
              </label>
              <Dropdown
                className="dropdown--full-width"
                toggle={
                  <DropdownToggle
                    id="toggle-id"
                    data-test="volume-type-dropdown"
                    onToggle={() => setVolumeTypeOpen(!isVolumeTypeOpen)}
                    toggleIndicator={CaretDownIcon}
                    isDisabled={isUpdate}
                  >
                    {state.volumeType.toUpperCase() || t('Select volume type')}
                  </DropdownToggle>
                }
                isOpen={isVolumeTypeOpen}
                dropdownItems={availableDeviceClasses}
                onSelect={() => setVolumeTypeOpen(false)}
                id="pool-volume-type"
              />
            </div>
          )}
          <div className="form-group ceph-block-pool-body__input">
            <label className="control-label" htmlFor="compression-check">
              {t('Compression')}
            </label>
            <div className="checkbox">
              <label>
                <input
                  type="checkbox"
                  onChange={(event) =>
                    dispatch({
                      type: BlockPoolActionType.SET_POOL_COMPRESSED,
                      payload: event.target.checked,
                    })
                  }
                  checked={state.isCompressed}
                  name="compression-check"
                  data-test="compression-checkbox"
                />
                {t('Enable compression')}
              </label>
            </div>
          </div>
          {state.isCompressed && (
            <Alert
              className="co-alert ceph-block-pool__alert"
              variant="info"
              title={t(
                'Enabling compression may result in little or no space savings for encrypted or random data. Also, enabling compression may have an impact on I/O performance.'
              )}
              isInline
            />
          )}
        </>
      ) : (
        <BlockPoolStatus status={POOL_PROGRESS.CLUSTERNOTREADY} />
      )}
    </>
  );
};

export type BlockPoolBodyPros = {
  cephCluster?: CephClusterKind;
  state: BlockPoolState;
  showPoolStatus: boolean;
  dispatch: React.Dispatch<BlockPoolAction>;
  isUpdate?: boolean;
};
