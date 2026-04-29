import { H2, P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';
import Link from 'next/link';

export type Pathway = {
  /** Icon component to display */
  icon: IconType;
  /** Title of the pathway */
  title: string;
  /** Description text */
  description: ReactNode;
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
  intro?: ReactNode;
  /** Array of pathway options */
  pathways: Pathway[];
  /** Optional callout shown below the pathway cards */
  callout?: ReactNode;
};

const PathwaysSection = ({
  id, title, intro, pathways, callout,
}: PathwaysSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="max-w-[1100px] mx-auto">
          <H2 className={`text-[28px] bd-md:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy text-center tracking-[-0.01em] ${intro ? 'mb-4' : 'mb-12 md:mb-16'}`}>
            {title}
          </H2>
          {intro && (
            <div className="text-size-sm bd-md:text-size-md leading-[1.6] text-bluedot-navy/70 text-center mb-12 md:mb-16 max-w-[860px] mx-auto">
              {intro}
            </div>
          )}

          <div className="grid grid-cols-1 bd-md:grid-cols-2 gap-6 lg:gap-8">
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
                    <h3 className="text-size-md font-semibold leading-[130%] text-bluedot-navy">
                      {pathway.title}
                    </h3>
                    <P className="text-size-sm leading-[1.65] text-bluedot-navy/70">
                      {pathway.description}
                    </P>
                    {pathway.linkUrl && pathway.linkText && (
                      <Link
                        href={pathway.linkUrl}
                        className="text-size-sm font-medium text-bluedot-normal hover:underline mt-1 inline-flex items-center gap-1 group-hover:gap-2 transition-all"
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

          {callout && (
            <div className="mt-10 md:mt-12 p-6 md:p-8 rounded-2xl border border-bluedot-navy/10 bg-bluedot-navy/[0.03]">
              <div className="text-size-sm leading-[1.7] text-bluedot-navy/80">
                {callout}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PathwaysSection;
