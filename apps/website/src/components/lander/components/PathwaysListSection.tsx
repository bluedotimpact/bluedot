import { P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { PageListGroup, PageListRow, pageSectionHeadingClass } from '../../PageListRow';

export type PathwaysListItem = {
  title: string;
  summary: ReactNode;
  href?: string;
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
    <section id={id} className="section section-body">
      <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className={pageSectionHeadingClass}>{title}</h3>
          {intro && <P>{intro}</P>}
        </div>
        <PageListGroup>
          {items.map((item) => (
            item.href ? (
              <PageListRow
                key={item.title}
                href={item.href}
                title={item.title}
                summary={item.summary}
                ctaLabel={item.ctaLabel ?? 'Explore the course'}
                external={item.external}
              />
            ) : (
              <div key={item.title} className="flex flex-col gap-3 min-[680px]:flex-row min-[680px]:items-center min-[680px]:justify-between min-[680px]:gap-6">
                <div className="flex items-stretch gap-4 min-w-0 flex-1">
                  <div className="w-1 flex-shrink-0 rounded-sm bg-bluedot-normal/30" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-[1.45] font-semibold text-bluedot-navy">{item.title}</p>
                    <p className="mt-1 text-[15px] leading-[1.6] text-bluedot-navy/62">{item.summary}</p>
                  </div>
                </div>
              </div>
            )
          ))}
        </PageListGroup>
      </div>
    </section>
  );
};

export default PathwaysListSection;
