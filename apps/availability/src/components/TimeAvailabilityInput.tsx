import {
  useEffect, useRef, useState, useMemo,
} from 'react';
import {
  FieldPath, FieldValues, UseControllerProps,
  useController,
} from 'react-hook-form';
import { CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';
import * as wa from 'weekly-availabilities';
import { snapToRect } from '../lib/util';

type Coord = { day: number; minute: number };
const serializeCoord = ({ day, minute }: Coord): wa.WeeklyTime => day * 24 * 60 + minute as wa.WeeklyTime;

// consts
export const MINUTES_IN_UNIT = 30;
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// utils
const normalizeBlock = ({ anchor, cursor }: { anchor: Coord; cursor: Coord; }): { min: Coord, max: Coord } => {
  return {
    min: { day: Math.min(anchor.day, cursor.day), minute: Math.min(anchor.minute, cursor.minute) },
    max: { day: Math.max(anchor.day, cursor.day), minute: Math.max(anchor.minute, cursor.minute) },
  };
};

const isWithin = (
  { min, max }: { min: Coord; max: Coord },
  { day, minute }: Coord,
) => {
  return (
    min.minute <= minute && max.minute >= minute && min.day <= day && max.day >= day
  );
};

type TimeAvailabilityMap = Record<wa.WeeklyTime, boolean>;

const TimeAvailabilityGrid: React.FC<{ show24: boolean, value: TimeAvailabilityMap, onChange: (v: TimeAvailabilityMap) => void }> = ({ show24, value, onChange }) => {
  const startUnit = show24 ? 0 : (8 * 60) / MINUTES_IN_UNIT;
  const endUnit = show24
    ? (24 * 60) / MINUTES_IN_UNIT
    : (23 * 60) / MINUTES_IN_UNIT;

  const cellCoords: Coord[] = [];
  const cellRefs: ({ ref: HTMLDivElement | null; coord: Coord } | null)[] = useMemo(() => [], []);
  const times = [];
  for (let i = startUnit; i <= endUnit; i++) {
    times.push(i);
    if (i !== endUnit) {
      for (let d = 0; d < days.length; d++) {
        cellCoords.push({ day: d, minute: i * MINUTES_IN_UNIT });
        cellRefs.push(null);
      }
    }
  }

  const timeToLabel = (time: number) => {
    const minutes = time * MINUTES_IN_UNIT;
    if (minutes < 0 || minutes > 1440) throw new Error(`Invalid time: ${time} (${minutes} mins)`);
    const hours = Math.floor(minutes / 60);
    const minutesRemaining = minutes - hours * 60;
    return `${hours.toString().padStart(2, '0')}:${minutesRemaining.toString().padStart(2, '0')}`;
  };

  const [dragState, setDragState] = useState<{
    dragging: false | 'neg' | 'pos';
    anchor?: Coord;
    cursor?: Coord;
  }>({ dragging: false });

  const dragStart = (cell: Coord) => {
    setDragState({
      dragging: value[serializeCoord(cell)] ? 'neg' : 'pos',
      anchor: cell,
      cursor: cell,
    });
  };

  const mainGrid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mouseMoveListener = (e: MouseEvent) => {
      if (!dragState.dragging || !mainGrid.current) return;

      const mousepos = { x: e.clientX, y: e.clientY };
      const { x, y } = snapToRect(mainGrid.current.getBoundingClientRect(), mousepos);

      const cell = cellRefs.find((c) => {
        if (!c?.ref) return false;
        const {
          top, bottom, left, right,
        } = c.ref.getBoundingClientRect();

        return (x >= left && x <= right && y >= top && y <= bottom);
      });

      if (cell) {
        setDragState((prev) => ({ ...prev, cursor: cell.coord }));
      }
    };
    document.addEventListener('mousemove', mouseMoveListener);

    const mouseUpListener = () => {
      if (!dragState.dragging || !dragState.anchor || !dragState.cursor) return;
      const { min, max } = normalizeBlock({
        anchor: dragState.anchor,
        cursor: dragState.cursor,
      });

      const targetVal = dragState.dragging === 'pos';
      const valueCopy = { ...value };

      for (let { day } = min; day <= max.day; day++) {
        for (let { minute } = min; minute <= max.minute; minute += MINUTES_IN_UNIT) {
          valueCopy[serializeCoord({ day, minute })] = targetVal;
        }
      }
      onChange(valueCopy);
      setDragState({ dragging: false });
    };
    document.addEventListener('mouseup', mouseUpListener);

    return () => {
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    };
  }, [value, cellRefs, dragState, mainGrid]);

  return (
    <div className="w-full touch-none text-size-xs text-stone-500">
      <div className="flex">
        <div className="w-12" />
        <div className="grid grid-cols-7 w-full text-center">
          {/* eslint-disable-next-line react/no-array-index-key */}
          {days.map((day, index) => <div key={index}>{day.slice(0, 1)}</div>)}
        </div>
      </div>
      <div className="flex">
        <div className="w-12">
          {times.map((time, i) => i % 2 === 0 && (
            <div key={time} className="h-8 flex justify-end px-1 py-px">
              <div className="-translate-y-2">{timeToLabel(time)}</div>
            </div>
          ))}
        </div>
        <div className="w-full">
          <div
            ref={mainGrid}
            className="grid grid-cols-7 bg-white border-t border-l border-gray-800 w-full"
          >
            {cellCoords.map((coord, i) => {
              const isBlocked = value[serializeCoord(coord)];

              const borderStyle = Math.floor(i / 7) % 2 === 0
                ? '[border-bottom-style:dotted]'
                : 'border-solid';

              const isInDraggedOverArea = dragState.dragging
                && dragState.anchor
                && dragState.cursor
                && isWithin(
                  normalizeBlock({
                    anchor: dragState.anchor,
                    cursor: dragState.cursor,
                  }),
                  coord,
                );

              return (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  ref={(ref) => { cellRefs[i] = { ref, coord }; }}
                  className={clsx(`relative h-4 border-gray-800 border-r border-b ${borderStyle}`, isBlocked && 'bg-green-400')}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    dragStart(coord);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    dragStart(coord);
                  }}
                >
                  <div className="size-full" draggable={false} />
                  {isInDraggedOverArea && <div className={clsx('size-full opacity-75 absolute inset-0 pointer-events-none', dragState.dragging === 'pos' ? 'bg-green-400' : 'bg-purple-400')} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export type TimeAvailabilityInputProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  className?: string,
} & UseControllerProps<TFieldValues, TName> & Required<Pick<UseControllerProps<TFieldValues, TName>, 'control'>>;

export const TimeAvailabilityInput = <
TFieldValues extends FieldValues = FieldValues,
TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ className, ...props }: TimeAvailabilityInputProps<TFieldValues, TName>) => {
  const { field } = useController(props);
  const [show24, setShow24] = useState(false);

  return (
    <div className="sm:flex gap-4">
      <TimeAvailabilityGrid value={field.value} onChange={(v) => field.onChange(v)} show24={show24} />
      <div className="sm:w-40 sm:mt-4 flex sm:flex-col gap-2">
        <CTALinkOrButton className="w-full" variant="secondary" onClick={() => setShow24(!show24)}>
          Show {show24 ? 'less' : 'more'}
        </CTALinkOrButton>
      </div>
    </div>
  );
};
