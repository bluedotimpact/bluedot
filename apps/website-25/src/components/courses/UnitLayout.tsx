import React from 'react';
import { isMobile } from 'react-device-detect';
import {
  HeroSection,
  HeroH1,
  Section,
  CTALinkOrButton,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import SideBar from './SideBar';
import { Unit } from '../../lib/api/db/tables';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import Congratulations from './Congratulations';

type UnitLayoutProps = {
  // Required
  courseTitle: string;
  unitNumber: number;
  units: Unit[];
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  courseTitle,
  unitNumber,
  units,
}) => {
  const unit = units.find((u) => Number(u.unitNumber) === unitNumber);
  const nextUnit = units[units.findIndex((u) => u === unit) + 1];

  if (!unit) {
    // Should never happen
    throw new Error('Unit not found');
  }

  return (
    <div>
      <Head>
        <title>{`${courseTitle}: Unit ${unitNumber}`}</title>
        <meta name="description" content={unit.title} />
      </Head>
      <HeroSection className="unit__hero">
        <HeroMiniTitle>{courseTitle}</HeroMiniTitle>
        <HeroH1>{unit.title}</HeroH1>
      </HeroSection>
      <Section className="unit__main">
        <div className="unit__content-container flex flex-col md:flex-row gap-16">
          {!isMobile && (
            <SideBar units={units} currentUnitNumber={unitNumber} />
          )}
          <div className="unit__content flex flex-col flex-1 max-w-[728px] gap-4">
            <MarkdownExtendedRenderer>
              {unit.content}
            </MarkdownExtendedRenderer>

            {nextUnit ? (
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url={nextUnit.path}>
                Next unit
              </CTALinkOrButton>
            ) : (
              <Congratulations courseTitle={courseTitle} courseUrl={unit.coursePath} />
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default UnitLayout;
