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
    <Collapsible
      title={title}
      className={clsx(
        'callout my-6 px-6 !py-0 rounded-xl !border !border-bluedot-navy/10 bg-white transition-shadow hover:shadow-sm',
        '[&_summary>span:first-child]:!text-size-sm [&_summary>span:first-child]:!font-medium [&_summary>span:first-child]:!text-bluedot-black [&_summary>span:first-child]:!leading-[160%]',
        '[&_summary_svg]:!size-4 [&_summary_svg]:!text-color-secondary-text',
        '[&_summary]:!py-4 [&_summary]:!items-center',
        '[&[open]_summary]:!pb-3 [&[open]_summary]:!border-b [&[open]_summary]:!border-bluedot-navy/10',
        '[&>div]:!pt-3 [&>div]:!pb-4 [&>div]:!flex [&>div]:!flex-col [&>div]:!gap-3',
        '[&>div_p]:!my-0 [&>div_ul]:!my-0 [&>div_ol]:!my-0',
        className,
      )}
    >
      {children}
    </Collapsible>
  );
};

export default Callout;
