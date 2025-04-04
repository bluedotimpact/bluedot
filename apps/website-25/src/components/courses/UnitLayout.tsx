import React from 'react';
import { BluedotRoute } from '@bluedot/ui/src/Breadcrumbs';
import { isMobile } from 'react-device-detect';
import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  Section,
  CTALinkOrButton,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { CourseUnit } from '@bluedot/ui/src/constants';
import ReactMarkdown from 'react-markdown';
import SideBar from './SideBar';

type UnitLayoutProps = {
  // Required
  course: string;
  unit: number;
  title: string;
  route: BluedotRoute;
  units: CourseUnit[];
  markdown: string;
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  course,
  unit,
  title,
  route,
  units,
  markdown,
}) => {
  const unitIndex = unit - 1;
  const nextUnitIndex = unitIndex + 1;

  return (
    <div>
      <Head>
        <title>{`${course}: Unit ${unit}`}</title>
        <meta name="description" content={title} />
      </Head>
      <HeroSection className="unit__hero">
        <HeroMiniTitle>{course}</HeroMiniTitle>
        <HeroH1>{title}</HeroH1>
      </HeroSection>
      <Breadcrumbs className="unit__breadcrumbs sticky top-[72px] md:top-[100px] z-10" route={route} />
      <Section className="unit__main">
        <div className="unit__content-container flex flex-col md:flex-row gap-16">
          {!isMobile && (
            <SideBar units={units} currentUnit={units[unitIndex]!} />
          )}
          <div className="unit__content flex flex-col flex-1 max-w-[728px] gap-4">
            <ReactMarkdown>
              {markdown}
            </ReactMarkdown>

            {nextUnitIndex < units.length ? (
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url={units[nextUnitIndex]!.href}>
                Next unit
              </CTALinkOrButton>
            ) : (
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url={route.url}>
                Claim your certificate!
              </CTALinkOrButton>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default UnitLayout;
