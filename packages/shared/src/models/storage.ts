import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const ODFStorageSystem: K8sModel = {
  label: 'Storage System',
  labelPlural: 'Storage Systems',
  apiVersion: 'v1alpha1',
  apiGroup: 'odf.openshift.io',
  plural: 'storagesystems',
  abbr: 'ss',
  namespaced: true,
  kind: 'StorageSystem',
  crd: true,
};

export const OCSStorageClusterModel: K8sModel = {
  label: 'Storage Cluster',
  labelPlural: 'Storage Clusters',
  apiVersion: 'v1',
  apiGroup: 'ocs.openshift.io',
  plural: 'storageclusters',
  abbr: 'OCS',
  namespaced: true,
  kind: 'StorageCluster',
  crd: true,
};

export const CephClusterModel: K8sModel = {
  label: 'Ceph Cluster',
  labelPlural: 'Ceph Clusters',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephclusters',
  abbr: 'CC',
  namespaced: true,
  kind: 'CephCluster',
  crd: true,
};
