import * as React from 'react';
import {
  HorizontalNavTab,
  isHorizontalNavTab,
} from '@odf/odf-plugin-sdk/extensions';
import PageHeading from '@odf/shared/heading/page-heading';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import {
  HorizontalNav,
  useResolvedExtensions,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Extension,
  ExtensionTypeGuard,
} from '@openshift-console/dynamic-plugin-sdk/lib/types';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { useLocation } from 'react-router-dom';
import { Grid, GridItem } from '@patternfly/react-core';
import { ODFStorageSystemMock } from '../../models';
import {
  HorizontalNavProps as DashboardTabProps,
  convertHorizontalNavTabToNavPage as convertDashboardTabToNav,
  useSortPages,
} from '../../utils';
import { StorageSystemListPage } from '../system-list/odf-system-list';
import ActivityCard from './activity-card/activity-card';
import ObjectCapacityCard from './object-storage-card/capacity-card';
import PerformanceCard from './performance-card/performance-card';
import { StatusCard } from './status-card/status-card';
import SystemCapacityCard from './system-capacity-card/capacity-card';
import './dashboard.scss';

const ODF_DASHBOARD_CONTEXT = 'odf-dashboard';

type ODFDashboardPageProps = {
  history: RouteComponentProps['history'];
};

const UpperSection: React.FC = () => (
  <Grid hasGutter>
    <GridItem md={8} sm={12}>
      <StatusCard />
    </GridItem>
    <GridItem md={4} rowSpan={2} sm={12}>
      <ActivityCard />
    </GridItem>
    <GridItem md={4} sm={12}>
      <SystemCapacityCard />
    </GridItem>
    <GridItem md={4} sm={12}>
      <ObjectCapacityCard />
    </GridItem>
    <GridItem md={12} sm={12}>
      <PerformanceCard />
    </GridItem>
  </Grid>
);

const isDashboardTab = (e: Extension) =>
  isHorizontalNavTab(e) && e.properties.contextId === ODF_DASHBOARD_CONTEXT;

export const ODFDashboard: React.FC = () => {
  return (
    <>
      <div className="odf-dashboard-body">
        <UpperSection />
      </div>
    </>
  );
};

const ODFDashboardPage: React.FC<ODFDashboardPageProps> = (props) => {
  const { t } = useCustomTranslation();
  const title = t('Data Foundation');
  const staticPages: DashboardTabProps[] = React.useMemo(
    () => [
      {
        id: 'overview',
        href: '',
        name: t('Overview'),
        component: ODFDashboard,
        contextId: ODF_DASHBOARD_CONTEXT,
      },
      {
        id: 'systems',
        href: 'systems',
        name: t('Storage Systems'),
        component: StorageSystemListPage,
        contextId: ODF_DASHBOARD_CONTEXT,
      },
    ],
    [t]
  );

  const [extensions, isLoaded, error] = useResolvedExtensions<HorizontalNavTab>(
    isDashboardTab as ExtensionTypeGuard<HorizontalNavTab>
  );

  const haveExtensionsResolved = isLoaded && _.isEmpty(error);
  const sortedPages = useSortPages({
    extensions,
    haveExtensionsResolved,
    staticPages,
  });

  const { history } = props;
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.endsWith('/odf/systems')) {
      history.push(`/odf/cluster/systems`);
    }
  }, [location, history]);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} />
      {/** Todo(bipuladh): Move to usage of common PF Tabs component */}
      <HorizontalNav
        pages={convertDashboardTabToNav(sortedPages)}
        resource={{
          kind: ODFStorageSystemMock.kind,
          apiVersion: `${ODFStorageSystemMock.apiGroup}/${ODFStorageSystemMock.apiVersion}`,
        }}
      />
    </>
  );
};

/**
 * To support legacy /odf routes.
 * Todo(fix): Remove from console in 4.10.
 */
export const Reroute: React.FC<ODFDashboardPageProps> = ({ history }) => {
  React.useEffect(() => {
    history.push(`/odf/cluster`);
  }, [history]);

  return null;
};

export default ODFDashboardPage;
