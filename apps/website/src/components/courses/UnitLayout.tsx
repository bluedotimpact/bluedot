import React from 'react';
import { isMobile } from 'react-device-detect';
import {
  HeroSection,
  HeroH1,
  Section,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import SideBar from './SideBar';
import { Unit } from '../../lib/api/db/tables';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import Congratulations from './Congratulations';
import { ROUTES } from '../../lib/routes';
import UnitFeedback from './UnitFeedback';
import CertificateLinkCard from './CertificateLinkCard';

type UnitLayoutProps = {
  // Required
  unit: Unit;
  unitNumber: number;
  units: Unit[];
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  unit,
  unitNumber,
  units,
}) => {
  const unitArrIndex = units.findIndex((u) => u.id === unit.id);
  const nextUnit = units[unitArrIndex + 1];
  const prevUnit = units[unitArrIndex - 1];

  if (!unit || unitArrIndex === -1) {
    // Should never happen
    throw new Error('Unit not found');
  }

  return (
    <div>
      <Head>
        <title>{`${unit.courseTitle}: Unit ${unitNumber}`}</title>
        <meta name="description" content={unit.title} />
      </Head>
      <HeroSection className="unit__hero">
        <HeroMiniTitle>{unit.courseTitle}</HeroMiniTitle>
        <HeroH1>{unit.title}</HeroH1>
      </HeroSection>
      <Breadcrumbs
        className="unit__breadcrumbs sticky top-[72px] md:top-[100px] z-10"
        route={{
          title: unit.courseTitle,
          url: unit.coursePath,
          parentPages: [ROUTES.home, ROUTES.courses],
        }}
      />
      <Section className="unit__main">
        <div className="unit__content-container flex flex-col md:flex-row gap-16">
          {!isMobile && (
            <SideBar units={units} currentUnitNumber={unitNumber} />
          )}
          <div className="unit__content flex flex-col flex-1 max-w-[728px] gap-6">
            <MarkdownExtendedRenderer>
              {unit.content}
            </MarkdownExtendedRenderer>

            <UnitFeedback unit={unit} />

            {!nextUnit ? (
              <>
                <Congratulations courseTitle={unit.courseTitle} coursePath={unit.coursePath} />
                <CertificateLinkCard courseId={unit.courseId} />
                <div className="unit__last-unit-cta-container flex flex-row justify-between mx-1">
                  <CTALinkOrButton className="last-unit__cta-link mx-auto" url={unit.coursePath} variant="secondary">
                    Back to course
                  </CTALinkOrButton>
                </div>
              </>
            ) : (
              <div className="unit__cta-container flex flex-row justify-between mt-6 mx-1">
                {prevUnit && (
                  <CTALinkOrButton className="unit__cta-link mr-auto" url={prevUnit.path} variant="secondary" withBackChevron>
                    Previous unit
                  </CTALinkOrButton>
                )}
                {nextUnit && (
                  <CTALinkOrButton className="unit__cta-link ml-auto" url={nextUnit.path} variant="primary" withChevron>
                    Next unit
                  </CTALinkOrButton>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default UnitLayout;
