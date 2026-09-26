import type { Unit } from '@bluedot/db';
import { Modal, ModalTitle } from '@bluedot/ui';
import type { BasicChunk, CourseProgress } from '../../server/routers/courses';
import type { CertificateData } from '../../server/routers/certificates';
import { CourseIcon } from './CourseIcon';
import { CourseSidebarUnit } from './CourseSidebarUnit';
import { SidebarCertificatePanel } from './SidebarCertificatePanel';
import { SidebarFacilitateAgainPanel } from './SidebarFacilitateAgainPanel';

type MobileCourseModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  certificateData: CertificateData | undefined;
  courseTitle: string;
  courseSlug: string;
  units: Unit[];
  currentUnitNumber: number;
  currentChunkIndex: number;
  unitChunks: Record<string, BasicChunk[]>;
  courseProgressData?: CourseProgress;
};

export const MobileCourseModal = ({
  isOpen,
  setIsOpen,
  certificateData,
  courseTitle,
  courseSlug,
  units,
  currentUnitNumber,
  currentChunkIndex,
  unitChunks,
  courseProgressData,
}: MobileCourseModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={(
        <div className="flex w-full flex-wrap items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-4">
            <CourseIcon courseSlug={courseSlug} />
            <ModalTitle>
              {courseTitle}
            </ModalTitle>
          </div>
        </div>
      )}
      bottomDrawerOnMobile
    >
      <div className="w-full max-w-modal">
        {/* The modal header already draws a bottom border; the first unit's divider would double it. */}
        <nav aria-label="Course content" className="px-2 [&>details:first-child]:border-t-0">
          {units.map((unit) => (
            <CourseSidebarUnit
              key={unit.id}
              unit={unit}
              chunks={unitChunks[unit.id] ?? []}
              chunkProgress={courseProgressData?.chunkProgressByUnitNumber[unit.unitNumber] ?? []}
              courseSlug={courseSlug}
              currentUnitNumber={currentUnitNumber}
              currentChunkIndex={currentChunkIndex}
              onChunkClick={() => setIsOpen(false)}
            />
          ))}
        </nav>
        <div className="mx-2 border-t border-subtle py-4 empty:hidden">
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
    </Modal>
  );
};
