import { Section } from '@bluedot/ui';
import { CTA_BASE_STYLES } from '@bluedot/ui/src/CTALinkOrButton';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

const EVENTS = [
  { year: '2021', description: <>Before BlueDot, we began as a University of Cambridge student group, <b>hosting discussions on transformative emerging technologies</b>.</> },
  { year: '2022', description: <>Launched <b>our first AI Safety course</b> with 400+ participants, founded BlueDot Impact, and established our London headquarters.</> },
  { year: '2023', description: <><b>Delivered a new course every four months</b>, training 800+ people in AI Alignment, Governance, and Biosecurity.</> },
  { year: '2024', description: <><b>Accelerated to monthly courses</b>, reaching 3500+ participants worldwide. Over 400 of our course graduates now work in AI Safety.</> },
  { year: '2025', description: <><b>Launching multiple courses weekly</b> and expanding a world-class team to scale our global impact.</> },
];

const MIN_WIDTH = 330;
const ARROW_OFFSET = 12;
const ARROW_RADIUS = 16;
const MAX_GAP = 16; // The max value of --spacing-space-between

type ConnectPosition = 'left' | 'right' | 'top';

type ArrowTerminus = {
  x: number;
  y: number;
  connect: ConnectPosition;
};

type ArrowProps = {
  start: ArrowTerminus;
  end: ArrowTerminus;
};

const Corner = ({ radius, angle, ...otherProps }: {
  radius: number;
  /** Rotation angle in degrees */
  angle: number;
} & React.SVGProps<SVGGElement>) => {
  return (
    <g
      {...otherProps}
      style={{
        // Note abuse of clsx to join something other than classNames
        transform: clsx(otherProps.style?.transform, `rotate(${angle}deg)`),
        transformOrigin: `${radius / 2}px ${radius / 2}px`,
      }}
    >
      <path
        d={`M0,0 A${radius},${radius} 0 0,1 ${radius},${radius}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2px"
      />
    </g>
  );
};

const Arrow = ({
  start, end,
}: ArrowProps) => {
  const defs = (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="5"
        refY="4"
        orient="auto"
        viewBox="0 0 8 8"
      >
        <path d="M1.5,1 L5,4 L1.5,7" fill="none" stroke="currentColor" strokeLinecap="round" />
      </marker>
    </defs>
  );

  const hasSecondLine = end.connect === 'top' || end.connect === start.connect;
  const hasThirdLine = end.connect === start.connect;

  const isMirrorCase = start.connect === 'left';
  const spaceForArc = isMirrorCase ? `${ARROW_RADIUS}px` : `${-ARROW_RADIUS}px`;
  const farEdgeX = isMirrorCase ? '1%' : '99%';
  const secondLineX = end.connect === 'top' ? `${end.x}px` : farEdgeX;
  const firstLineXEnd = `calc(${secondLineX} + ${spaceForArc})`;

  const secondLineYEnd = hasThirdLine ? end.y - ARROW_RADIUS : end.y;

  // Achieve the effect of mirroring the arcs along their left edge through a combination of translation and scale(-1, 1)
  const arcTransformStart = isMirrorCase
    ? `translate(calc(${firstLineXEnd} - ${ARROW_RADIUS}px), ${start.y}px) scale(-1, 1)`
    : `translate(${firstLineXEnd}, ${start.y}px)`;
  const arcTransformEnd = isMirrorCase
    ? `translate(calc(${firstLineXEnd} - ${ARROW_RADIUS}px), calc(${end.y}px - ${ARROW_RADIUS}px)) scale(-1, 1)`
    : `translate(${firstLineXEnd}, calc(${end.y}px - ${ARROW_RADIUS}px))`;

  return (
    <svg className="arrow absolute size-full text-bluedot-normal">
      {defs}
      <line x1={start.x} y1={start.y} x2={hasSecondLine ? firstLineXEnd : end.x} y2={start.y} stroke="currentColor" strokeWidth="2px" {...(!hasSecondLine && { markerEnd: 'url(#arrowhead)' })} />
      {hasSecondLine && <Corner style={{ transform: arcTransformStart }} radius={ARROW_RADIUS} angle={0} />}
      {hasSecondLine && <line x1={secondLineX} y1={start.y + ARROW_RADIUS} x2={secondLineX} y2={secondLineYEnd} stroke="currentColor" strokeWidth="2px" {...(!hasThirdLine && { markerEnd: 'url(#arrowhead)' })} />}
      {hasThirdLine && <Corner style={{ transform: arcTransformEnd }} radius={ARROW_RADIUS} angle={90} />}
      {hasThirdLine && <line x1={firstLineXEnd} y1={end.y} x2={end.x} y2={end.y} stroke="currentColor" strokeWidth="2px" markerEnd="url(#arrowhead)" />}
    </svg>
  );
};

/**
 * Calculate the grid-space coordinates (row, col) of the event with this index
 */
const calculateGridPosition = ({ index, itemsPerRow }: { index: number; itemsPerRow: number; }) => {
  // To allow space for the arrows, skip the leftmost cell every other line
  const effectiveIndex = itemsPerRow > 1 ? index + Math.floor((index + 1) / (itemsPerRow * 2)) : index;

  const row = Math.floor(effectiveIndex / itemsPerRow);
  const colOffset = effectiveIndex % itemsPerRow;
  const col = row % 2 === 0 ? colOffset : itemsPerRow - 1 - colOffset;

  return {
    row,
    col,
  };
};

/**
 * Calculate the positions where this arrow should connect in container-space coordinates
 * of the event with this index (x, y, relative to top left of history-section element)
 */
const calculateConnectPosition = ({ rect, relativeTo, connect }: { rect: DOMRect; relativeTo: DOMRect; connect: ConnectPosition; }): ArrowTerminus => {
  const calculateXY = () => {
    if (connect === 'top') {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top - ARROW_OFFSET,
      };
    }

    if (connect === 'right') {
      return {
        x: rect.right + ARROW_OFFSET,
        y: rect.top + rect.height / 2,
      };
    }

    // connect === 'left'
    return {
      x: rect.left - ARROW_OFFSET,
      y: rect.top + rect.height / 2,
    };
  };

  const xy = calculateXY();

  return {
    x: xy.x - relativeTo.left,
    y: xy.y - relativeTo.top,
    connect,
  };
};

const HistorySection = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [eventPositions, setEventPositions] = useState<{ row: number, col: number }[]>([]);
  const [arrows, setArrows] = useState<ArrowProps[]>([]);
  const [itemsPerRow, setItemsPerRow] = useState<number>(1);

  useEffect(() => {
    const container = containerRef.current;

    const calculatePositions = () => {
      if (!container) return;

      // Solution to the equation MIN_WIDTH*N + (N−1)*MAX_GAP < container.offsetWidth
      const newItemsPerRow = Math.max(1, Math.floor((container.offsetWidth + MAX_GAP) / (MIN_WIDTH + MAX_GAP)));
      setItemsPerRow(newItemsPerRow);

      const newEventPositions = EVENTS.map((_, index) => calculateGridPosition({ index, itemsPerRow: newItemsPerRow }));
      if (JSON.stringify(newEventPositions) !== JSON.stringify(eventPositions)) {
        setEventPositions(newEventPositions);
      }

      const yearElements = container?.querySelectorAll('.history-event__year');
      if (!yearElements || yearElements.length !== newEventPositions.length) {
        // eslint-disable-next-line no-console
        console.error('Unexpected error in calculating event positions');
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const newArrows: ArrowProps[] = [];

      for (let i = 1; i < newEventPositions.length; i++) {
        const prevGridCoords = newEventPositions[i - 1]!;
        const prevRect = yearElements[i - 1]!.getBoundingClientRect();
        const currentGridCoords = newEventPositions[i]!;
        const currentRect = yearElements[i]!.getBoundingClientRect();

        const startConnect = prevGridCoords.row % 2 === 0 ? 'right' : 'left';
        const start = calculateConnectPosition({
          rect: prevRect,
          relativeTo: containerRect,
          connect: prevGridCoords.row % 2 === 0 ? 'right' : 'left',
        });
        const getEndConnect = () => {
          if (prevGridCoords.row === currentGridCoords.row) {
            return startConnect === 'right' ? 'left' : 'right';
          }
          // Connect to the top of the next year if we're on the far left OR there is only 1 column
          return (newItemsPerRow === 1 || prevGridCoords.row % 2 === 1) ? 'top' : startConnect;
        };
        const end = calculateConnectPosition({
          rect: currentRect,
          relativeTo: containerRect,
          connect: getEndConnect(),
        });

        newArrows.push({ start, end });
      }

      setArrows(newArrows);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    return () => window.removeEventListener('resize', calculatePositions);
  }, [eventPositions]);

  return (
    <Section title="Our history" titleLevel="h3">
      <div ref={containerRef} className="history-section w-full relative grid grid-cols-[auto] gap-space-between justify-items-center">
        {EVENTS.map((event, index) => {
          const { row, col } = eventPositions[index] || { row: 0, col: 0 };
          return (
            <HistoryEvent
              key={event.year}
              year={event.year}
              row={row}
              col={col}
              zigZag={itemsPerRow === 1}
              animate={event.year === '2025'}
            >
              {event.description}
            </HistoryEvent>
          );
        })}
        {arrows.map((arrow, index) => (
          <Arrow key={EVENTS[index]?.year} {...arrow} />
        ))}
      </div>
    </Section>
  );
};

const HistoryEvent = ({
  year,
  children,
  row,
  col,
  zigZag,
  animate,
}: {
  year: string;
  children: React.ReactNode;
  row: number;
  col: number;
  zigZag: boolean;
  animate?: boolean;
}) => {
  const alignRight = zigZag && row % 2 === 1 && 'ml-auto';
  const [animationActive, setAnimationActive] = useState(false);
  const eventRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting !== animationActive) {
          setAnimationActive(entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    if (eventRef.current) {
      observer.observe(eventRef.current);
    }

    // eslint-disable-next-line consistent-return
    return () => {
      if (eventRef.current) {
        observer.unobserve(eventRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={eventRef}
      className={`history-event flex flex-col gap-space-between min-w-[${MIN_WIDTH}px] max-w-[430px] w-full`}
      style={{
        gridRow: row + 1,
        gridColumn: col + 1,
      }}
    >
      <div
        className={clsx(
          'history-event__year bg-bluedot-normal text-color-text-on-dark duration-500',
          CTA_BASE_STYLES,
          alignRight && 'ml-auto',
          !animationActive && 'outline-transparent',
          animationActive && 'outline-2 outline-bluedot-normal outline-offset-2',
        )}
      >
        {year}
      </div>
      <p
        className={clsx(
          'history-event__description max-w-[250px] text-balanced',
          alignRight && 'text-right ml-auto',
        )}
      >
        {children}
      </p>
    </div>
  );
};

export default HistorySection;
