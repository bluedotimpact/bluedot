import { H2, P } from '@bluedot/ui';
import { ReactNode } from 'react';
import { IconType } from 'react-icons';
import Link from 'next/link';

export type Pathway = {
  /** Icon component to display */
  icon: IconType;
  /** Title of the pathway */
  title: string;
  /** Description text */
  description: string;
  /** Accent color for the icon background */
  accentColor: string;
  /** Optional link URL */
  linkUrl?: string;
  /** Optional link text */
  linkText?: string;
};

export type PathwaysSectionProps = {
  /** Section heading */
  title: string;
  /** Introductory text below the heading */
  intro: string;
  /** Array of pathway options */
  pathways: Pathway[];
};

const PathwaysSection = ({ title, intro, pathways }: PathwaysSectionProps) => {
  return (
    <section className="w-full bg-[#FAFAFA]">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <div className="max-w-[960px] mx-auto">
          <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-6 tracking-[-0.01em]">
            {title}
          </H2>
          <P className="text-size-md leading-[1.6] text-[#13132E]/80 text-center mb-12 max-w-[600px] mx-auto">
            {intro}
          </P>

          <div className="grid grid-cols-1 min-[680px]:grid-cols-2 gap-4 min-[680px]:gap-6">
            {pathways.map((pathway) => {
              const IconComponent = pathway.icon;
              return (
                <div
                  key={pathway.title}
                  className="group flex flex-col gap-4 p-6 rounded-xl bg-white border border-[rgba(19,19,46,0.08)] hover:border-[rgba(19,19,46,0.12)] hover:shadow-md transition-all duration-200"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: pathway.accentColor }}
                  >
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[18px] font-semibold leading-tight text-[#13132E]">
                      {pathway.title}
                    </h3>
                    <P className="text-[15px] leading-[1.6] text-[#13132E]/70">
                      {pathway.description}
                    </P>
                    {pathway.linkUrl && pathway.linkText && (
                      <Link
                        href={pathway.linkUrl}
                        className="text-[15px] font-medium text-bluedot-normal hover:underline mt-1 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        {pathway.linkText}
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PathwaysSection;
