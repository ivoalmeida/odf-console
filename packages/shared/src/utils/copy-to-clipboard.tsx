import * as React from 'react';
import * as _ from 'lodash-es';
import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';
import { Button, Tooltip } from '@patternfly/react-core';
import { CopyIcon } from '@patternfly/react-icons';
import { useCustomTranslation } from '../useCustomTranslationHook';
import '../style.scss';

export const CopyToClipboard: React.FC<CopyToClipboardProps> = React.memo(
  (props) => {
    const [copied, setCopied] = React.useState(false);

    const { t } = useCustomTranslation();
    const tooltipText = copied ? t('Copied') : t('Copy to clipboard');
    const tooltipContent = [
      <span className="co-nowrap" key="nowrap">
        {tooltipText}
      </span>,
    ];

    // Default to value if no visible value was specified.
    const visibleValue = _.isNil(props.visibleValue)
      ? props.value
      : props.visibleValue;

    return (
      <div className="odf-copy-to-clipboard">
        <pre
          className="odf-pre-wrap odf-copy-to-clipboard__text odf-copy-to-clipboard__pre"
          data-test="copy-to-clipboard"
        >
          {visibleValue}
        </pre>
        <Tooltip
          content={tooltipContent}
          trigger="click mouseenter focus"
          exitDelay={1250}
        >
          <CTC text={props.value} onCopy={() => setCopied(true)}>
            <Button
              variant="plain"
              onMouseEnter={() => setCopied(false)}
              className="odf-copy-to-clipboard__btn pf-c-clipboard-copy__group-copy"
              type="button"
            >
              <CopyIcon />
              <span className="sr-only">{t('Copy to clipboard')}</span>
            </Button>
          </CTC>
        </Tooltip>
      </div>
    );
  }
);

export type CopyToClipboardProps = {
  value: string;
  visibleValue?: React.ReactNode;
};

CopyToClipboard.displayName = 'CopyToClipboard';
