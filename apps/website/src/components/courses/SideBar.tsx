import type { Unit } from '@bluedot/db';
import { cn, H2, P } from '@bluedot/ui';
import type { BasicChunk, CourseProgress } from '../../server/routers/courses';
import type { CertificateData } from '../../server/routers/certificates';
import { CourseIcon } from './CourseIcon';
import { CourseSidebarUnit } from './CourseSidebarUnit';
import { SidebarCertificatePanel } from './SidebarCertificatePanel';
import { SidebarFacilitateAgainPanel } from './SidebarFacilitateAgainPanel';

export type SideBarProps = {
  courseTitle: string;
  courseSlug: string;
  certificateData: CertificateData | undefined;
  units: Unit[];
  currentUnitNumber: number;
  currentChunkIndex: number;
  unitChunks: Record<string, BasicChunk[]>;
  className?: string;
  courseProgressData?: CourseProgress;
};

export const SideBar = ({
  courseTitle,
  courseSlug,
  certificateData,
  courseProgressData,
  className,
  units,
  currentUnitNumber,
  currentChunkIndex,
  unitChunks,
}: SideBarProps) => {
  return (
    <div className={cn(
      'sidebar flex flex-col bg-canvas',
      'size-full md:w-[360px]',
      'border-r-[0.5px] border-default',
      className,
    )}
    >
      <div className="flex flex-row items-center gap-4 p-6">
        <CourseIcon courseSlug={courseSlug} size="xlarge" />
        <div className="flex min-w-0 flex-col">
          <H2 className="text-size-md">{courseTitle}</H2>
          {courseProgressData && courseProgressData.courseProgress.totalCount > 0 && (
            <P className="text-size-xs text-secondary">{courseProgressData.courseProgress.percentage}% completed</P>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <nav aria-label="Course content" className="px-6">
          {units.map((unit) => (
            <CourseSidebarUnit
              key={unit.id}
              unit={unit}
              chunks={unitChunks[unit.id] ?? []}
              chunkProgress={courseProgressData?.chunkProgressByUnitNumber[unit.unitNumber] ?? []}
              courseSlug={courseSlug}
              currentUnitNumber={currentUnitNumber}
              currentChunkIndex={currentChunkIndex}
            />
          ))}
        </nav>
        {/* Both panels render nothing for some statuses; `empty:hidden` drops the divider with them. */}
        <div className="mx-6 border-t border-subtle py-6 empty:hidden">
          {certificateData?.status === 'is-facilitator'
            ? <SidebarFacilitateAgainPanel courseSlug={courseSlug} />
            : (
              <SidebarCertificatePanel
                courseTitle={courseTitle}
                courseSlug={courseSlug}
                certificateData={certificateData}
              />
            )}
        </div>
      </div>
    </div>
  );
};
