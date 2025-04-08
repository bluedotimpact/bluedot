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
import { Exercise, Unit } from '../../lib/api/db/tables';
import { ROUTES } from '../../lib/routes';
import MultipleChoice from './MultipleChoice';

type UnitLayoutProps = {
  // Required
  courseSlug: string;
  courseTitle: string;
  unitNumber: number;
  unitTitle: string;
  route: BluedotRoute;
  units: Unit[];
  unitContent: string;
  unitExercises: Exercise[];
};

const UnitLayout: React.FC<UnitLayoutProps> = ({
  courseSlug,
  courseTitle,
  unitNumber,
  unitTitle,
  route,
  units,
  unitContent,
  unitExercises,
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
            <SideBar courseSlug={courseSlug} units={units} currentUnitNumber={unitNumber} />
          )}
          <div className="unit__content flex flex-col flex-1 max-w-[728px] gap-4">
            <ReactMarkdown>
              {unitContent}
            </ReactMarkdown>

            {unitExercises && unitExercises.map((exercise) => {
              if (exercise.type === 'multiple-choice') {
                return (
                  <MultipleChoice
                    title={exercise.title}
                    question={exercise.description}
                    options={['Option 1', 'Option 2', 'Option 3', 'Option 4']}
                    correctOption={exercise.answer}
                />
              );
              }
            })}

            {unitNumber < units.length ? (
              <CTALinkOrButton className="unit__cta-link self-end mt-6" url={ROUTES.makeCoursePageRoute(courseSlug, courseTitle, unitNumber + 1).url}>
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
