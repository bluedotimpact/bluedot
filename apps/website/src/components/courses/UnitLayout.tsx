import React from 'react';
import Head from 'next/head';
import { isMobile } from 'react-device-detect';
import clsx from 'clsx';
import {
  Section,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa6';

import SideBar from './SideBar';
import { Unit } from '../../lib/api/db/tables';
import MarkdownExtendedRenderer from './MarkdownExtendedRenderer';
import Congratulations from './Congratulations';
import { ROUTES } from '../../lib/routes';
import UnitFeedback from './UnitFeedback';
import CertificateLinkCard from './CertificateLinkCard';
import { A, H1, P } from '../Text';

type UnitLayoutProps = {
  // Required
  unit: Unit;
  unitNumber: number;
  units: Unit[];
};

type MobileHeaderProps = {
  className?: string;
  unit: Unit;
  prevUnit?: Unit;
  nextUnit?: Unit;
};

const MobileHeader: React.FC<MobileHeaderProps> = ({
  className,
  unit,
  prevUnit,
  nextUnit,
}) => {
  return (
    <div className={clsx('mobile-unit-header bg-color-canvas border-b border-color-divider w-full p-3', className)}>
      <nav className="mobile-unit-header__nav flex flex-row justify-between">
        <div className="mobile-unit-header__prev-unit-container size-8">
          {prevUnit && (
            <A className="mobile-unit-header__prev-unit-cta flex flex-row items-center gap-1 no-underline" href={prevUnit?.path} aria-label="Previous unit">
              <img src="/icons/bubble-arrow.svg" alt="" className="size-8" />
            </A>
          )}
        </div>
        <div className="mobile-unit-header__course-container flex flex-row gap-2 items-center">
          <img src="/icons/course.svg" className="size-8" alt="" />
          <div className="mobile-unit-header__course-title-container flex flex-col">
            <p className="mobile-unit-header__course-header text-size-xxs text-charcoal-light">{unit.courseTitle}</p>
            <p className="mobile-unit-header__course-title bluedot-h4 text-size-xs">{unit.title}</p>
          </div>
        </div>
        <div className="mobile-unit-header__next-unit-container size-8">
          {nextUnit && (
            <A className="mobile-unit-header__next-unit-cta flex flex-row items-center gap-1 no-underline" href={nextUnit?.path} aria-label="Next unit">
              <img src="/icons/bubble-arrow.svg" alt="" className="size-8 rotate-180" />
            </A>
          )}
        </div>
      </nav>
    </div>
  );
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

      <Breadcrumbs
        className="unit__breadcrumbs hidden md:block md:sticky md:top-16 z-10"
        route={{
          title: unit.courseTitle,
          url: unit.coursePath,
          parentPages: [ROUTES.home, ROUTES.courses],
        }}
      >
        <div className="unit__breadcrumbs-cta-container flex flex-row items-center gap-6">
          {prevUnit && (
            <A className="unit__breadcrumbs-cta flex flex-row items-center gap-1 no-underline" href={prevUnit?.path} aria-label="Previous unit">
              <FaArrowLeft className="size-3" /> Prev
            </A>
          )}
          {nextUnit && (
            <A className="unit__breadcrumbs-cta flex flex-row items-center gap-1 no-underline" href={nextUnit?.path} aria-label="Next unit">
              Next <FaArrowRight className="size-3" />
            </A>
          )}
        </div>
      </Breadcrumbs>

      <MobileHeader className="unit__mobile-header md:hidden sticky top-16 z-10" unit={unit} prevUnit={prevUnit} nextUnit={nextUnit} />

      <Section className="unit__main">
        <div className="unit__content-container flex flex-col md:flex-row">
          {!isMobile && (
            <SideBar units={units} currentUnitNumber={unitNumber} />
          )}
          <div className="unit__content flex flex-col flex-1 max-w-[680px] mx-auto gap-6">
            <div className="unit__title-container">
              <P className="unit__course-title text-size-sm mb-2">Unit {unit.unitNumber}</P>
              <H1 className="unit__title font-serif text-[32px]">{unit.title}</H1>
            </div>
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
                <CTALinkOrButton className="unit__cta-link ml-auto" url={nextUnit.path} variant="primary" withChevron>
                  Complete and continue
                </CTALinkOrButton>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
};

export default UnitLayout;
