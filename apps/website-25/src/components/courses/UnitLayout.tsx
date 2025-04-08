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
import ReactMarkdown from 'react-markdown';
import SideBar from './SideBar';
import { Unit } from '../../lib/api/db/tables';
import MultipleChoice from './MultipleChoice';

type UnitLayoutProps = {
  // Required
  courseId: string;
  courseTitle: string;
  unitNumber: number;
  unitTitle: string;
  route: BluedotRoute;
  units: Unit[];
  unitContent: string;
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  courseId,
  courseTitle,
  unitNumber,
  unitTitle,
  route,
  units,
  unitContent,
}) => {
  return (
    <div>
      <Head>
        <title>{`${courseTitle}: Unit ${unitNumber}`}</title>
        <meta name="description" content={unitTitle} />
      </Head>
      <HeroSection className="unit__hero">
        <HeroMiniTitle>{courseTitle}</HeroMiniTitle>
        <HeroH1>{unitTitle}</HeroH1>
      </HeroSection>
      <Breadcrumbs className="unit__breadcrumbs sticky top-[72px] md:top-[100px] z-10" route={route} />
      <Section className="unit__main">
        <div className="unit__content-container flex flex-col md:flex-row gap-16">
          {!isMobile && (
            <SideBar courseId={courseId} units={units} currentUnitNumber={unitNumber} />
          )}
          <div className="unit__content flex flex-col flex-1 max-w-[728px] gap-4">
            <ReactMarkdown>
              {unitContent}
            </ReactMarkdown>

            {unitNumber < units.length ? (
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url={`/courses/${courseId}/unit/${unitNumber + 1}`}>
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
