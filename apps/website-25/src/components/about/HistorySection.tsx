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

const MIN_WIDTH = 300;
const ARROW_OFFSET = 12;
const ARROW_RADIUS = 16;

type ConnectPosition = 'left' | 'right' | 'top' | 'bottom';

type ArrowTerminus = {
  x: number;
  y: number;
  connect: 'left' | 'right' | 'top' | 'bottom';
};

type ArrowProps = {
  start: ArrowTerminus;
  end: ArrowTerminus;
};

const Arc = ({ radius, angle, ...otherProps }: {
  radius: number;
  /** Rotation angle in degrees */
  angle: number;
} & React.SVGProps<SVGGElement>) => {
  return (
    <g
      {...otherProps}
      style={{
        // TODO note abuse of clsx
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

  // if ((start.connect === 'right' && end.connect === 'left') || (start.connect === 'left' && end.connect === 'right')) {
  //   return (
  //     <svg className="arrow absolute size-full text-bluedot-normal">
  //       {defs}
  //       <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="currentColor" strokeWidth="2px" markerEnd="url(#arrowhead)" />
  //     </svg>
  //   );
  // }

  const hasSecondLine = end.connect === 'top' || end.connect === start.connect;
  const hasThirdLine = end.connect === start.connect;

  return (
    <svg className="arrow absolute size-full text-bluedot-normal">
      {defs}
      <line x1={start.x} y1={start.y} x2={hasSecondLine ? `calc(99% - ${ARROW_RADIUS}px)` : end.x} y2={start.y} stroke="currentColor" strokeWidth="2px" />
      {/* <Arc style={{ transform: `translate(calc(99% - ${ARROW_RADIUS}px), ${start.y}px)` }} radius={ARROW_RADIUS} angle={0} /> */}
      {hasSecondLine && <line x1="99%" y1={start.y + ARROW_RADIUS} x2="99%" y2={end.y - ARROW_RADIUS} stroke="currentColor" strokeWidth="2px" />}
      {/* <Arc style={{ transform: `translate(calc(99% - ${ARROW_RADIUS}px), calc(${end.y}px - ${ARROW_RADIUS}px))` }} radius={ARROW_RADIUS} angle={90} /> */}
      {hasThirdLine && <line x1={`calc(99% - ${ARROW_RADIUS}px)`} y1={end.y} x2={end.x} y2={end.y} stroke="currentColor" strokeWidth="2px" />}
    </svg>
  );
  return null;
};

const calculateGridPosition = ({ index, itemsPerRow }: { index: number; itemsPerRow: number; }) => {
  const row = Math.floor(index / itemsPerRow);
  const colOffset = index % itemsPerRow;
  const col = row % 2 === 0 ? colOffset : itemsPerRow - 1 - colOffset;

  return {
    row,
    col,
  };
};

const calculateConnectPosition = ({ rect, relativeTo, connect }: { rect: DOMRect; relativeTo: DOMRect; connect: ConnectPosition; }): ArrowTerminus => {
  const calculateXY = () => {
    if (connect === 'top') {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + ARROW_OFFSET,
      };
    }

    if (connect === 'right') {
      return {
        x: rect.right + ARROW_OFFSET,
        y: rect.top + rect.height / 2,
      };
    }

    if (connect === 'bottom') {
      return {
        x: rect.left + rect.width / 2,
        y: rect.bottom - ARROW_OFFSET,
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

  useEffect(() => {
    const container = containerRef.current;

    const calculatePositions = () => {
      if (!container) return;

      // Calculate event rows/cols
      const itemsPerRow = Math.floor(container.offsetWidth / MIN_WIDTH);
      const newEventPositions = EVENTS.map((_, index) => calculateGridPosition({ index, itemsPerRow }));
      if (JSON.stringify(newEventPositions) !== JSON.stringify(eventPositions)) {
        setEventPositions(newEventPositions);
      }

      console.log('Calculating arrow positions...');
      const yearElements = container?.querySelectorAll('.history-event__year');
      if (!yearElements || yearElements.length !== newEventPositions.length) {
        console.error('Unexpected error in calculating event positions');
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const newArrows: ArrowProps[] = [];

      // TODO improve readability
      for (let i = 1; i < newEventPositions.length; i++) {
        const prevPos = newEventPositions[i - 1]!;
        const prevRect = yearElements[i - 1]!.getBoundingClientRect();
        const currentPos = newEventPositions[i]!;
        const currentRect = yearElements[i]!.getBoundingClientRect();

        const startConnect = prevPos.row % 2 === 0 ? 'right' : 'left';
        const start = calculateConnectPosition({
          rect: prevRect,
          relativeTo: containerRect,
          connect: prevPos.row % 2 === 0 ? 'right' : 'left',
        });
        const getEndConnect = () => {
          if (prevPos.row === currentPos.row) {
            return startConnect === 'right' ? 'left' : 'right';
          }
          return itemsPerRow === 1 ? 'top' : startConnect;
        };
        const end = calculateConnectPosition({
          rect: currentRect,
          relativeTo: containerRect,
          connect: getEndConnect(),
        });

        newArrows.push({ start, end });
      }

      console.log('New arrows calculated:', newArrows);
      setArrows(newArrows);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    return () => window.removeEventListener('resize', calculatePositions);
  }, [eventPositions]);

  return (
    <Section title="Our history" titleLevel="h3">
      <div ref={containerRef} className="history-section relative grid grid-cols-subgrid gap-space-between">
        {EVENTS.map((event, index) => {
          const { row, col } = eventPositions[index] || { row: 0, col: 0 };
          return (
            <HistoryEvent key={event.year} year={event.year} row={row} col={col}>
              {event.description}
            </HistoryEvent>
          );
        })}
        {arrows.map((arrow, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Arrow key={index} {...arrow} />
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
}: {
  year: string;
  children: React.ReactNode;
  row: number;
  col: number;
}) => {
  return (
    <div
      className="history-event flex flex-col gap-space-between"
      style={{
        minWidth: `${MIN_WIDTH}px`,
        gridRow: row + 1,
        gridColumn: col + 1,
      }}
    >
      <div className={clsx('history-event__year bg-bluedot-normal text-color-text-on-dark', CTA_BASE_STYLES)}>
        {year}
      </div>
      <p className="history-event__description max-w-[250px] text-balanced">{children}</p>
    </div>
  );
};

export default HistorySection;
