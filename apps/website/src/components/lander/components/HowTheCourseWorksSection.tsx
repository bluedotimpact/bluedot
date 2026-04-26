import { P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { trpc } from '../../../utils/trpc';
import { pageSectionHeadingClass } from '../../PageListRow';

export type CourseUnits = {
  intenseUnits?: number;
  partTimeUnits?: number;
};

export type HowTheCourseWorksSectionProps = {
  id?: string;
  title: string;
  courseSlug: string;
  paragraphs: (units: CourseUnits) => ReactNode[];
};

const HowTheCourseWorksSection = ({
  id, title, courseSlug, paragraphs,
}: HowTheCourseWorksSectionProps) => {
  const { data: rounds } = trpc.courseRounds.getRoundsForCourse.useQuery({ courseSlug });

  const intenseUnits = rounds?.intense?.[0]?.numberOfUnits ?? undefined;
  const partTimeUnits = rounds?.partTime?.[0]?.numberOfUnits ?? undefined;

  const lines = paragraphs({ intenseUnits, partTimeUnits });

  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="w-full bd-md:max-w-[840px] bd-md:mx-auto">
          <h3 className={`${pageSectionHeadingClass} mb-6`}>{title}</h3>
          <div className="flex flex-col gap-5">
            {lines.map((line, index) => (
              <P key={index}>{line}</P>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowTheCourseWorksSection;
