import { P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { pageSectionHeadingClass } from '../../PageListRow';

export type WhoIsThisForTextSectionProps = {
  id?: string;
  title: string;
  paragraphs: ReactNode[];
};

const WhoIsThisForTextSection = ({
  id, title, paragraphs,
}: WhoIsThisForTextSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="w-full bd-md:max-w-[840px] bd-md:mx-auto">
          <h3 className={`${pageSectionHeadingClass} mb-6`}>{title}</h3>
          <div className="flex flex-col gap-5">
            {paragraphs.map((paragraph, index) => (
              <P key={index}>{paragraph}</P>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisForTextSection;
