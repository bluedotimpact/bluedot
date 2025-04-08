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
import ReactMarkdown from 'react-markdown';
import SideBar from './SideBar';
import { Unit } from '../../lib/api/db/tables';

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
            <ReactMarkdown>
              {unit.content}
            </ReactMarkdown>

            {nextUnit ? (
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url={nextUnit.path}>
                Next unit
              </CTALinkOrButton>
            ) : (
              // TODO: link
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url="https://bluedot.org">
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
