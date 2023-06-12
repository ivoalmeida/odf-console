import * as React from 'react';
import { DeploymentModel, NodeModel } from '@odf/shared/models';
import { getUID } from '@odf/shared/selectors';
import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk-internal/lib/extensions/console-types';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import DefaultIcon from '@patternfly/react-icons/dist/esm/icons/builder-image-icon';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import {
  ContainerNodeIcon,
  CubeIcon,
  LevelDownAltIcon,
} from '@patternfly/react-icons';
import {
  Decorator,
  DEFAULT_DECORATOR_RADIUS,
  DEFAULT_LAYER,
  DefaultNode,
  getDefaultShapeDecoratorCenter,
  Layer,
  Node,
  NodeShape,
  observer,
  ScaleDetailsLevel,
  ShapeProps,
  TOP_LAYER,
  TopologyQuadrant,
  useHover,
  WithContextMenuProps,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  useVisualizationController,
  NodeStatus,
} from '@patternfly/react-topology';
import useAlerts from '../../monitoring/useAlert';
import { useCustomTranslation } from '../../useCustomTranslationHook';
import { TopologyDataContext } from '../Context';
import { TopologySearchContext } from '../Context/SearchContext';
import { getStatusWithDescriptors } from '../utils';
import './StyleNode.scss';

const getResourceModel = (resource: K8sResourceCommon): K8sKind => {
  if (resource?.kind === NodeModel.kind) {
    return NodeModel;
  }
  if (resource?.kind === DeploymentModel.kind) {
    return DeploymentModel;
  }
  return DeploymentModel;
};

const ICON_PADDING = 20;

type StyleNodeProps = {
  element: Node;
  getCustomShape?: (node: Node) => React.FunctionComponent<ShapeProps>;
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node
  ) => { x: number; y: number };
  showLabel?: boolean; // Defaults to true
  labelIcon?: React.ComponentClass<SVGIconProps>;
  showStatusDecorator?: boolean; // Defaults to false
  regrouping?: boolean;
  dragging?: boolean;
} & Partial<
  WithContextMenuProps &
    WithCreateConnectorProps &
    WithDragNodeProps &
    WithSelectionProps
>;

const getTypeIcon = (resourceKind?: string): React.ComponentClass<any, any> => {
  switch (resourceKind) {
    case NodeModel.kind:
      return ContainerNodeIcon;
    case DeploymentModel.kind:
      return CubeIcon;
    default:
      return DefaultIcon;
  }
};

const renderIcon = (data: any, element: Node): React.ReactNode => {
  const { width, height } = element.getDimensions();
  const shape = element.getNodeShape();
  const iconSize =
    (shape === NodeShape.trapezoid ? width : Math.min(width, height)) -
    (shape === NodeShape.stadium ? 5 : ICON_PADDING) * 2;
  const Component = getTypeIcon(data.kind || data?.resource?.kind);

  return (
    <g
      transform={`translate(${(width - iconSize) / 2}, ${
        (height - iconSize) / 2
      })`}
    >
      <Component width={iconSize} height={iconSize} />
    </g>
  );
};

const renderDecorator = (
  element: Node,
  quadrant: TopologyQuadrant,
  icon: React.ReactNode,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node,
    radius?: number
  ) => {
    x: number;
    y: number;
  },
  tooltip?: string,
  onClick?: any
): React.ReactNode => {
  const { x, y } = getShapeDecoratorCenter
    ? getShapeDecoratorCenter(quadrant, element)
    : getDefaultShapeDecoratorCenter(quadrant, element);

  return (
    <Tooltip content={tooltip}>
      <Decorator
        x={x}
        y={y}
        radius={DEFAULT_DECORATOR_RADIUS}
        showBackground
        icon={icon}
        onClick={onClick}
      />
    </Tooltip>
  );
};

const renderDecorators = (
  element: Node,
  data: any,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: Node
  ) => {
    x: number;
    y: number;
  }
): React.ReactNode => {
  if (!data.showDecorators) {
    return null;
  }
  const onStepOntoClick = () => {
    element.getController().fireEvent('STEP_INTO_EVENT', {
      ...data,
      id: element.getId(),
    });
  };

  return (
    <>
      {data.canStepInto &&
        renderDecorator(
          element,
          TopologyQuadrant.lowerRight,
          <LevelDownAltIcon />,
          getShapeDecoratorCenter,
          'Enter node',
          onStepOntoClick
        )}
    </>
  );
};

const StyleNode: React.FunctionComponent<StyleNodeProps> = ({
  element,
  onContextMenu,
  contextMenuOpen,
  showLabel,
  dragging,
  regrouping,
  onHideCreateConnector,
  ...rest
}) => {
  const data = element.getData();
  const controller = useVisualizationController();
  const detailsLevel = useDetailsLevel();
  const [hover, hoverRef] = useHover();

  const { t } = useCustomTranslation();

  const { activeItemsUID, activeItem } = React.useContext(
    TopologySearchContext
  );
  const { nodeDeploymentMap } = React.useContext(TopologyDataContext);
  // Change this to search query instead

  const [alerts] = useAlerts();

  const resource: K8sResourceCommon = data.resource;
  const resourceModel = getResourceModel(resource);

  const isSearchActive = activeItemsUID.length > 0;

  const { status, message } = React.useMemo(() => {
    if (!resource) return { status: NodeStatus.default, message: '' };
    return getStatusWithDescriptors(
      resourceModel,
      nodeDeploymentMap,
      resource,
      alerts,
      t
    );
  }, [resource, resourceModel, nodeDeploymentMap, alerts, t]);
  const resourceUID = getUID(resource);
  const isElementActive = activeItemsUID.includes(resourceUID);
  const highlightNode = activeItem === resourceUID;

  React.useEffect(() => {
    if (highlightNode) {
      controller
        .getGraph()
        .panIntoView(element, { minimumVisible: 200, offset: 100 });
    }
  }, [highlightNode, controller, element]);

  const classnames = classNames(
    { 'odf-topology__filter': isSearchActive },
    { 'odf-topology__filter--active': isElementActive }
  );

  const passedData = React.useMemo(() => {
    const newData = { ...data };
    Object.keys(newData).forEach((key) => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data]);

  React.useEffect(() => {
    if (detailsLevel === ScaleDetailsLevel.low) {
      onHideCreateConnector && onHideCreateConnector();
    }
  }, [detailsLevel, onHideCreateConnector]);

  const LabelIcon = passedData.labelIcon;
  return (
    <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={hoverRef}>
        <DefaultNode
          className={classnames}
          element={element}
          scaleLabel={detailsLevel !== ScaleDetailsLevel.low}
          scaleNode={hover && detailsLevel === ScaleDetailsLevel.low}
          {...rest}
          {...passedData}
          dragging={dragging}
          regrouping={regrouping}
          showLabel={
            hover || (detailsLevel !== ScaleDetailsLevel.low && showLabel)
          }
          showStatusBackground={
            !hover && detailsLevel === ScaleDetailsLevel.low
          }
          showStatusDecorator={
            detailsLevel === ScaleDetailsLevel.high &&
            passedData.showStatusDecorator
          }
          onStatusDecoratorClick={() => null}
          onContextMenu={data.showContextMenu ? onContextMenu : undefined}
          contextMenuOpen={contextMenuOpen}
          onShowCreateConnector={null}
          onHideCreateConnector={null}
          labelIcon={LabelIcon && <LabelIcon noVerticalAlign />}
          attachments={
            (hover || detailsLevel === ScaleDetailsLevel.high) &&
            renderDecorators(element, passedData, rest.getShapeDecoratorCenter)
          }
          {...(highlightNode ? { selected: true } : {})}
          nodeStatus={status}
          statusDecoratorTooltip={message}
        >
          {(hover || detailsLevel !== ScaleDetailsLevel.low) &&
            renderIcon(passedData, element)}
        </DefaultNode>
      </g>
    </Layer>
  );
};

export default observer(StyleNode);
