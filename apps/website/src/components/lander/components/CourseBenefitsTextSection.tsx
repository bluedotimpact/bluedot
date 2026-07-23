import { H3, H4, P } from '@bluedot/ui';
import { type ReactNode } from 'react';

export type CourseBenefitsTextSectionProps = {
  id?: string;
  title: string;
  paragraphs?: ReactNode[];
  items?: {
    heading: string;
    body: ReactNode;
  }[];
};

const CourseBenefitsTextSection = ({
  id, title, paragraphs = [], items = [],
}: CourseBenefitsTextSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="w-full bd-md:max-w-text bd-md:mx-auto">
          <H3 className="mb-8">{title}</H3>
          {paragraphs.length > 0 && (
            <div className="flex flex-col gap-5">
              {paragraphs.map((paragraph, index) => (
                <P key={index}>{paragraph}</P>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div className={paragraphs.length > 0 ? 'mt-8 flex flex-col gap-8' : 'flex flex-col gap-8'}>
              {items.map((item) => (
                <div key={item.heading} className="flex flex-col gap-2">
                  <H4>
                    {item.heading}
                  </H4>
                  <P>{item.body}</P>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseBenefitsTextSection;
