import { Collapsible } from '@bluedot/ui';
import clsx from 'clsx';
import type React from 'react';

type CalloutProps = React.PropsWithChildren<{
  title: string;
  className?: string;
}>;

const Callout: React.FC<CalloutProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <Collapsible title={title} className={clsx('callout bg-stone-200 border-l-8 border-b-0 px-8 my-6', className)}>
      {children}
    </Collapsible>
  );
};

export default Callout;
