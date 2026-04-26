import { P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { PageListGroup, PageListRow, pageSectionHeadingClass } from '../../PageListRow';

export type PathwaysListItem = {
  title: string;
  summary: ReactNode;
  href: string;
  ctaLabel?: string;
  external?: boolean;
};

export type PathwaysListSectionProps = {
  id?: string;
  title: string;
  intro?: ReactNode;
  items: PathwaysListItem[];
};

const PathwaysListSection = ({
  id, title, intro, items,
}: PathwaysListSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className={pageSectionHeadingClass}>{title}</h3>
            {intro && <P>{intro}</P>}
          </div>
          <PageListGroup>
            {items.map((item) => (
              <PageListRow
                key={item.title}
                href={item.href}
                title={item.title}
                summary={item.summary}
                ctaLabel={item.ctaLabel ?? 'Explore the course'}
                external={item.external}
              />
            ))}
          </PageListGroup>
        </div>
      </div>
    </section>
  );
};

export default PathwaysListSection;
