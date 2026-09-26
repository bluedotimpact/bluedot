import type { Unit } from '@bluedot/db';
import { ClickTarget, cn } from '@bluedot/ui';
import { useEffect, useRef, useState } from 'react';
import { FaChevronRight } from 'react-icons/fa6';
import type { BasicChunk, ChunkProgress } from '../../server/routers/courses';
import { ChunkIcon } from '../icons';

export type CourseSidebarUnitProps = {
  unit: Unit;
  chunks: BasicChunk[];
  chunkProgress: ChunkProgress[];
  courseSlug: string;
  currentUnitNumber: number;
  currentChunkIndex: number;
  /** Fired after any chunk link is activated. The mobile drawer uses it to close itself. */
  onChunkClick?: () => void;
};

export const CourseSidebarUnit = ({
  unit,
  chunks,
  chunkProgress,
  courseSlug,
  currentUnitNumber,
  currentChunkIndex,
  onChunkClick,
}: CourseSidebarUnitProps) => {
  const isCurrentUnit = !!unit.unitNumber && currentUnitNumber === Number(unit.unitNumber);
  const [isExpanded, setIsExpanded] = useState(isCurrentUnit);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setIsExpanded(isCurrentUnit);
  }, [isCurrentUnit]);

  useEffect(() => {
    if (isExpanded && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isExpanded]);

  return (
    <details
      ref={detailsRef}
      open={isExpanded}
      onToggle={(e) => setIsExpanded(e.currentTarget.open)}
      className="group border-t border-subtle scroll-mb-5 marker:hidden [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer items-center gap-2 rounded-surface py-4 text-left transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <span className="flex-1 text-size-xs font-semibold leading-normal text-primary">
          {unit.unitNumber}. {unit.title}
        </span>
        <FaChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 text-primary transition-transform group-open:rotate-90 motion-reduce:transition-none"
        />
      </summary>
      <ul className="flex flex-col gap-1 pb-4">
        {chunks.map((chunk, index) => (
          <ChunkRow
            key={chunk.id}
            chunk={chunk}
            progress={chunkProgress[index]}
            href={`/courses/${courseSlug}/${unit.unitNumber}/${index + 1}`}
            isActive={isCurrentUnit && currentChunkIndex === index}
            onClick={onChunkClick}
          />
        ))}
      </ul>
    </details>
  );
};

type ChunkRowProps = {
  chunk: BasicChunk;
  progress: ChunkProgress | undefined;
  href: string;
  isActive: boolean;
  onClick?: () => void;
};

const ChunkRow = ({
  chunk, progress, href, isActive, onClick,
}: ChunkRowProps) => (
  <li>
    <ClickTarget
      url={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-surface p-4 text-left text-primary no-underline transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        isActive && 'bg-tint',
      )}
    >
      <ChunkIcon isActive={isActive} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-size-xs leading-normal">{chunk.chunkTitle}</span>
        {chunk.estimatedTime != null && (
          <span className="flex gap-1 text-size-xxs leading-normal text-secondary">
            <span>{formatTime(chunk.estimatedTime)}</span>
            {progress && progress.totalCount > 0 && (
              <>
                {/* Dot is outside of span so strikethrough doesn't extend to dot and look overly long */}
                ⋅
                <span className={cn(progress.allCompleted && 'line-through')}>
                  {progress.completedCount} of {progress.totalCount} completed
                </span>
              </>
            )}
          </span>
        )}
      </span>
    </ClickTarget>
  </li>
);

const formatTime = (min: number) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}min` : ''}`);
