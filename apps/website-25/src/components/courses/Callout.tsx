import { Collapsible } from '@bluedot/ui';
import clsx from 'clsx';
import React from 'react';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';

type CalloutProps = {
  title: string;
  children?: string;
  className?: string;
};

const Callout: React.FC<CalloutProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <Collapsible title={title} className={clsx('callout bg-stone-200 border-l-8 px-8', className)}>
      <MarkdownExtendedRenderer>{children}</MarkdownExtendedRenderer>
    </Collapsible>
  );
};

export default Callout;
