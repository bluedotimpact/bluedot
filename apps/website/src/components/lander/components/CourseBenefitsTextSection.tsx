import { P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { pageSectionHeadingClass } from '../../PageListRow';

export type CourseBenefitsTextSectionProps = {
  id?: string;
  title: string;
  items: {
    heading: string;
    body: ReactNode;
  }[];
};

const CourseBenefitsTextSection = ({ id, title, items }: CourseBenefitsTextSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="w-full bd-md:max-w-[840px] bd-md:mx-auto">
          <h3 className={`${pageSectionHeadingClass} mb-8`}>{title}</h3>
          <div className="flex flex-col gap-8">
            {items.map((item) => (
              <div key={item.heading} className="flex flex-col gap-2">
                <h4 className="text-[18px] font-semibold leading-[1.4] text-bluedot-navy">
                  {item.heading}
                </h4>
                <P>{item.body}</P>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseBenefitsTextSection;
