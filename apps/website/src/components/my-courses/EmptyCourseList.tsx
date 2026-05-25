import { CTALinkOrButton } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { BooksIcon } from '../icons';

export type EmptyCourseListProps = {
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  icon?: ReactNode;
};

const EmptyCourseList = ({
  title, description, cta, icon = <BooksIcon aria-hidden />,
}: EmptyCourseListProps) => (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <div className="text-bluedot-normal">{icon}</div>
    <p className="text-size-md font-semibold text-bluedot-navy">{title}</p>
    {description && <p className="max-w-[40ch] text-size-sm text-bluedot-navy/60">{description}</p>}
    {cta && (
      <CTALinkOrButton variant="primary" size="small" url={cta.href} className="text-size-xxs">
        {cta.label}
      </CTALinkOrButton>
    )}
  </div>
);

export default EmptyCourseList;
