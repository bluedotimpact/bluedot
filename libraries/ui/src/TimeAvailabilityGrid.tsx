import {
  useEffect, useRef, useState, useMemo,
} from 'react';
import clsx from 'clsx';

export const MINUTES_IN_UNIT = 30;
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Coord = { day: number; minute: number };
const serializeCoord = ({ day, minute }: Coord): number => day * 24 * 60 + minute;

const normalizeBlock = ({ anchor, cursor }: { anchor: Coord; cursor: Coord }): { min: Coord; max: Coord } => {
  return {
    min: { day: Math.min(anchor.day, cursor.day), minute: Math.min(anchor.minute, cursor.minute) },
    max: { day: Math.max(anchor.day, cursor.day), minute: Math.max(anchor.minute, cursor.minute) },
  };
};

const isWithin = ({ min, max }: { min: Coord; max: Coord }, { day, minute }: Coord) => {
  return min.minute <= minute && max.minute >= minute && min.day <= day && max.day >= day;
};

const snapToRect = (
  { top, bottom, left, right }: { top: number; bottom: number; left: number; right: number },
  { x, y }: { x: number; y: number },
) => {
  return {
    // eslint-disable-next-line no-nested-ternary
    x: x < left ? left + 5 : x > right ? right - 5 : x,
    // eslint-disable-next-line no-nested-ternary
    y: y > bottom ? bottom - 5 : y < top ? top + 5 : y,
  };
};

export type TimeAvailabilityMap = Record<number, boolean>;

export type TimeAvailabilityGridProps = {
  value: TimeAvailabilityMap;
  onChange: (v: TimeAvailabilityMap) => void;
  /**
   * First hour shown in the grid (inclusive). Integer in [0, 23].
   * Must be strictly less than `endHour`. Defaults to 0.
   */
  startHour?: number;
  /**
   * Last hour shown in the grid (exclusive — labels go up to but do not include this hour as a cell row).
   * Integer in [1, 24]. Must be strictly greater than `startHour`. Defaults to 24.
   */
  endHour?: number;
};

const validateHourRange = (startHour: number, endHour: number) => {
  if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
    throw new Error(`TimeAvailabilityGrid: startHour must be an integer in [0, 23], got ${startHour}`);
  }

  if (!Number.isInteger(endHour) || endHour < 1 || endHour > 24) {
    throw new Error(`TimeAvailabilityGrid: endHour must be an integer in [1, 24], got ${endHour}`);
  }

  if (startHour >= endHour) {
    throw new Error(`TimeAvailabilityGrid: startHour (${startHour}) must be less than endHour (${endHour})`);
  }
};

export const TimeAvailabilityGrid: React.FC<TimeAvailabilityGridProps> = ({
  value,
  onChange,
  startHour = 0,
  endHour = 24,
}) => {
  validateHourRange(startHour, endHour);
  const startUnit = (startHour * 60) / MINUTES_IN_UNIT;
  const endUnit = (endHour * 60) / MINUTES_IN_UNIT;

  const cellCoords: Coord[] = [];
  const cellRefs: ({ ref: HTMLDivElement | null; coord: Coord } | null)[] = useMemo(() => [], []);
  const times = [];
  for (let i = startUnit; i <= endUnit; i++) {
    times.push(i);
    if (i !== endUnit) {
      for (let d = 0; d < days.length; d++) {
        cellCoords.push({ day: d, minute: i * MINUTES_IN_UNIT });
        // WH note: I spent a few minutes trying to refactor to remove this, but gave up
        // because I found it hard to follow the code. Try again at your own risk.
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
    const movePointerListener = (e: PointerEvent) => {
      if (!dragState.dragging || !mainGrid.current) return;

      const mousepos = { x: e.clientX, y: e.clientY };
      const { x, y } = snapToRect(mainGrid.current.getBoundingClientRect(), mousepos);

      const cell = cellRefs.find((c) => {
        if (!c?.ref) return false;
        const { top, bottom, left, right } = c.ref.getBoundingClientRect();

        return x >= left && x <= right && y >= top && y <= bottom;
      });

      if (cell) {
        setDragState((prev) => ({ ...prev, cursor: cell.coord }));
      }
    };

    document.addEventListener('pointermove', movePointerListener);

    const pointerUpListener = () => {
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

    document.addEventListener('pointerup', pointerUpListener);

    return () => {
      document.removeEventListener('pointermove', movePointerListener);
      document.removeEventListener('pointerup', pointerUpListener);
    };
  }, [value, cellRefs, dragState, mainGrid, onChange]);

  return (
    <div className="text-size-xs w-full touch-none text-stone-500">
      <div className="flex">
        <div className="w-12" />
        <div className="grid w-full grid-cols-7 text-center">
          {days.map((day, index) => (
            <div key={index}>{day.slice(0, 1)}</div>
          ))}
        </div>
      </div>
      <div className="flex">
        <div className="w-12">
          {times.map((time, i) =>
            i % 2 === 0 && (
              <div key={time} className="flex h-8 justify-end px-1 py-px">
                <div className="-translate-y-2">{timeToLabel(time)}</div>
              </div>
            ))}
        </div>
        <div className="w-full">
          <div ref={mainGrid} className="grid w-full grid-cols-7 border-t border-l border-gray-800 bg-white">
            {cellCoords.map((coord, i) => {
              const isBlocked = value[serializeCoord(coord)];

              const borderStyle = Math.floor(i / 7) % 2 === 0 ? '[border-bottom-style:dotted]' : 'border-solid';

              const isInDraggedOverArea
                = dragState.dragging
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
                <div
                  key={i}
                  ref={(ref) => {
                    cellRefs[i] = { ref, coord };
                  }}
                  className={clsx(
                    `relative h-4 border-r border-b border-gray-800 ${borderStyle}`,
                    isBlocked && 'bg-green-400',
                  )}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    dragStart(coord);
                  }}
                >
                  <div className="size-full" draggable={false} />
                  {isInDraggedOverArea && (
                    <div
                      className={clsx(
                        'pointer-events-none absolute inset-0 size-full opacity-75',
                        dragState.dragging === 'pos' ? 'bg-green-400' : 'bg-purple-400',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
