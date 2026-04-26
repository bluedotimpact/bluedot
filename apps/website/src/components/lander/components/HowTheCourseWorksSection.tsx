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
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto">
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
