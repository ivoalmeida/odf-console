import * as React from 'react';
import {
  ClusterServiceVersionModel,
  SubscriptionModel,
} from '@odf/shared/models';
import { ClusterServiceVersionKind, SubscriptionKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { referenceForModel } from '@odf/shared/utils';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

export const useFetchCsv = ({
  specName,
  namespace,
  cluster,
}: UseFetchCsvProps): UseFetchCsvResult => {
  const { t } = useCustomTranslation();
  const [subs, subsLoaded, subsLoadError] = useK8sWatchResource<
    SubscriptionKind[]
  >({
    isList: true,
    kind: referenceForModel(SubscriptionModel),
    namespace,
    cluster: cluster,
  });
  const csvName = React.useRef<string>(null);
  const csvNamespace = React.useRef<string>(null);

  React.useEffect(() => {
    if (subsLoaded && !subsLoadError && subs.length) {
      const sub = subs.find((s) => s.spec.name === specName);
      csvName.current = sub?.status?.installedCSV;
      csvNamespace.current = sub?.metadata?.namespace;
    }
  }, [specName, subs, subsLoadError, subsLoaded]);

  const [csv, csvLoaded, csvLoadError] =
    useK8sWatchResource<ClusterServiceVersionKind>({
      kind: referenceForModel(ClusterServiceVersionModel),
      name: csvName.current,
      namespaced: true,
      namespace: csvNamespace.current,
      isList: false,
      cluster: cluster,
    });

  if (csvName.current === null || csvNamespace.current === null) {
    return [undefined, false, undefined];
  }

  if (!csvName.current || !csvNamespace.current) {
    return [undefined, true, new Error(t('Not found'))];
  }

  return [csv, csvLoaded, csvLoadError];
};

type UseFetchCsvResult = [ClusterServiceVersionKind, boolean, any];
type UseFetchCsvProps = {
  specName: string;
  namespace?: string;
  cluster?: string;
};
