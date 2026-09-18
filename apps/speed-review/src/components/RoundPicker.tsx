import { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { CTALinkOrButton, H1, ProgressDots } from '@bluedot/ui';
import { type Round } from '../lib/api/airtable';
import { type Direction } from '../lib/client/types';

const DIRECTION_STORAGE_KEY = 'speed-review:direction';
const ROUNDS_PER_COURSE = 3;
const ALLOWED_COURSES = ['AGI Strategy', 'Biosecurity', 'Technical AI Safety', 'Technical AI Safety Project'];

const loadDirection = (): Direction => {
  if (typeof window === 'undefined') return 'top';
  return window.localStorage.getItem(DIRECTION_STORAGE_KEY) === 'bottom' ? 'bottom' : 'top';
};

type RoundPickerProps = {
  onSelect: (round: Round, direction: Direction) => void;
};

const courseFromRoundName = (name: string): string => name.split('(')[0]?.trim() ?? '';

export const RoundPicker: React.FC<RoundPickerProps> = ({ onSelect }) => {
  const [{ data, loading, error }] = useAxios<{ rounds: Round[] }>({
    method: 'get',
    url: '/api/rounds',
  });
  const [direction, setDirection] = useState<Direction>('top');

  useEffect(() => {
    setDirection(loadDirection());
  }, []);

  const updateDirection = (next: Direction) => {
    setDirection(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DIRECTION_STORAGE_KEY, next);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-canvas flex items-center justify-center">
        <ProgressDots className="text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-canvas flex items-center justify-center p-8">
        <p className="text-error-fg">{error.message}</p>
      </div>
    );
  }

  const rounds = data?.rounds ?? [];

  const grouped = rounds.reduce<Record<string, Round[]>>((acc, round) => {
    const courseName = courseFromRoundName(round.name);
    if (!ALLOWED_COURSES.includes(courseName)) return acc;
    acc[courseName] ??= [];
    acc[courseName].push(round);
    return acc;
  }, {});

  const directionButton = (value: Direction, label: string) => {
    const active = direction === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => updateDirection(value)}
        aria-pressed={active}
        className={`flex-1 min-h-11 px-3 py-2 rounded-md text-size-sm font-medium transition-colors ${
          active
            ? 'bg-active text-primary'
            : 'text-secondary hover:text-primary'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-canvas flex items-start justify-center p-6 sm:p-10">
      <div className="bg-raised rounded-xl border border-subtle p-4 sm:p-8 max-w-3xl w-full space-y-6">
        <div>
          <H1 className="text-size-lg text-primary">Speed Reviewer</H1>
          <p className="text-size-sm text-secondary mt-1">Choose a round to start reviewing applications.</p>
        </div>

        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-secondary mb-2">Review from</p>
          <div className="flex gap-1 bg-canvas border border-subtle rounded-lg p-1">
            {directionButton('top', 'Top of pile')}
            {directionButton('bottom', 'Bottom of pile')}
          </div>
        </div>

        {rounds.length === 0 ? (
          <p className="text-size-sm text-secondary">No active or future rounds found.</p>
        ) : (
          <div className="space-y-2">
            {ALLOWED_COURSES.filter((c) => grouped[c]?.length).map((courseName) => (
              <details key={courseName} open className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-11">
                  <span className="text-size-xs font-semibold text-secondary">{courseName}</span>
                  <svg className="size-3.5 text-secondary transition-transform group-open:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="space-y-2 mt-2">
                  {grouped[courseName]!.slice(0, ROUNDS_PER_COURSE).map((round) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => onSelect(round, direction)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-subtle hover:border-accent hover:bg-tint transition-colors font-medium text-primary"
                    >
                      {round.name}
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}

        <CTALinkOrButton
          variant="ghost"
          size="small"
          className="min-h-11"
          onClick={() => window.location.reload()}
        >
          Refresh
        </CTALinkOrButton>
      </div>
    </div>
  );
};
