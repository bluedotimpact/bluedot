import { H2, P } from '@bluedot/ui';
import { type IconType } from 'react-icons';
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
  /** Optional ID for anchor links */
  id?: string;
  /** Section heading */
  title: string;
  /** Introductory text below the heading */
  intro?: string;
  /** Array of pathway options */
  pathways: Pathway[];
};

const PathwaysSection = ({
  id, title, intro, pathways,
}: PathwaysSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <div className="max-w-[1100px] mx-auto">
          <H2 className={`text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy text-center tracking-[-0.01em] ${intro ? 'mb-4' : 'mb-12 md:mb-16'}`}>
            {title}
          </H2>
          {intro && (
            <P className="text-[16px] min-[680px]:text-[17px] leading-[1.6] text-bluedot-navy/70 text-center mb-12 md:mb-16 max-w-[600px] mx-auto">
              {intro}
            </P>
          )}

          <div className="grid grid-cols-1 min-[680px]:grid-cols-2 gap-6 lg:gap-8">
            {pathways.map((pathway) => {
              const IconComponent = pathway.icon;
              return (
                <div
                  key={pathway.title}
                  className="group flex flex-col gap-4 p-6 rounded-xl bg-white border border-bluedot-navy/8 hover:border-bluedot-navy/15 hover:shadow-sm transition-all duration-200"
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: pathway.accentColor }}
                  >
                    <IconComponent className="text-white" size={24} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[17px] min-[680px]:text-[18px] font-semibold leading-[130%] text-bluedot-navy">
                      {pathway.title}
                    </h3>
                    <P className="text-[15px] leading-[1.65] text-bluedot-navy/70">
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
