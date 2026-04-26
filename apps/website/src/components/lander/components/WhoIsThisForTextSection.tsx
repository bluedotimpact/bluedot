import { CTALinkOrButton, P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { pageSectionHeadingClass } from '../../PageListRow';

export type WhoIsThisForTextSectionProps = {
  id?: string;
  title: string;
  paragraphs: ReactNode[];
  bottomCta?: {
    text: ReactNode;
    buttonText: string;
    buttonUrl: string;
  };
};

const WhoIsThisForTextSection = ({
  id, title, paragraphs, bottomCta,
}: WhoIsThisForTextSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto">
          <h3 className={`${pageSectionHeadingClass} mb-6`}>{title}</h3>
          <div className="flex flex-col gap-5">
            {paragraphs.map((paragraph, index) => (
              <P key={index}>{paragraph}</P>
            ))}
          </div>
          {bottomCta && (
            <div className="mt-8 flex flex-col items-start gap-4">
              <P>{bottomCta.text}</P>
              <CTALinkOrButton url={bottomCta.buttonUrl} variant="primary">
                {bottomCta.buttonText}
              </CTALinkOrButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisForTextSection;
