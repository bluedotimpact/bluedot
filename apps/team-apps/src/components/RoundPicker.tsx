import { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { Callout, CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { FaChevronDown } from 'react-icons/fa6';
import { type Round } from '../lib/api/airtable';
import {
  type Direction, type FilterMatch, type FilterOption, type QueueFilters, MAX_QUEUE_FILTERS,
} from '../lib/client/types';

const DIRECTION_STORAGE_KEY = 'speed-review:direction';
const FILTERS_STORAGE_KEY = 'speed-review:filters';
const FILTER_MATCH_STORAGE_KEY = 'speed-review:filter-match';
const ROUNDS_PER_COURSE = 3;
const ALLOWED_COURSES = ['AGI Strategy', 'Biosecurity', 'Technical AI Safety', 'Technical AI Safety Project'];

// Storage access throws when the browser blocks it (e.g. strict privacy
// settings). These are only preferences, so fall back to defaults rather than
// breaking the picker.
const readStored = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The preference just won't be remembered.
  }
};

const loadDirection = (): Direction => (readStored(DIRECTION_STORAGE_KEY) === 'bottom' ? 'bottom' : 'top');

const loadFilterMatch = (): FilterMatch => (readStored(FILTER_MATCH_STORAGE_KEY) === 'all' ? 'all' : 'any');

const loadFilterIds = (): string[] => readStored(FILTERS_STORAGE_KEY)?.split(',').filter(Boolean) ?? [];

type RoundPickerProps = {
  // filters is undefined when nothing is ticked.
  onSelect: (round: Round, direction: Direction, filters?: QueueFilters) => void;
  // Why the picker is showing again, e.g. a filtered round failed to load.
  notice?: string;
};

const courseFromRoundName = (name: string): string => name.split('(')[0]?.trim() ?? '';

export const RoundPicker: React.FC<RoundPickerProps> = ({ onSelect, notice }) => {
  const [{ data, loading, error }] = useAxios<{ rounds: Round[] }>({
    method: 'get',
    url: '/api/rounds',
  });
  // Filters are optional: if they fail to load, the section stays hidden and
  // rounds remain selectable.
  const [{ data: filterData, loading: filtersLoading }] = useAxios<{ options: FilterOption[] }>({
    method: 'get',
    url: '/api/filter-options',
  });
  const [direction, setDirection] = useState<Direction>('top');
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [filterMatch, setFilterMatch] = useState<FilterMatch>('any');

  useEffect(() => {
    setDirection(loadDirection());
    setFilterMatch(loadFilterMatch());
  }, []);

  const updateDirection = (next: Direction) => {
    setDirection(next);
    writeStored(DIRECTION_STORAGE_KEY, next);
  };

  const updateFilterIds = (next: string[]) => {
    setFilterIds(next);
    writeStored(FILTERS_STORAGE_KEY, next.join(','));
  };

  const updateFilterMatch = (next: FilterMatch) => {
    setFilterMatch(next);
    writeStored(FILTER_MATCH_STORAGE_KEY, next);
  };

  const filterOptions = filterData?.options;
  // Options can be disabled or removed in Airtable between visits.
  useEffect(() => {
    if (!filterOptions) return;
    const offered = new Set(filterOptions.map((option) => option.id));
    const kept = loadFilterIds().filter((id) => offered.has(id)).slice(0, MAX_QUEUE_FILTERS);
    setFilterIds(kept);
    writeStored(FILTERS_STORAGE_KEY, kept.join(','));
  }, [filterOptions]);

  // Wait for the filters too, so they can't appear late above the rounds and
  // shift a round button out from under a tap.
  if (loading || filtersLoading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] md:min-h-dvh bg-canvas flex items-center justify-center">
        <ProgressDots className="text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] md:min-h-dvh bg-canvas flex items-center justify-center p-8">
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

  const segmentButton = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 min-h-11 min-w-11 px-3 py-2 rounded-md text-size-sm font-medium transition-colors ${
        active
          ? 'bg-active text-primary'
          : 'text-secondary hover:text-primary'
      }`}
    >
      {label}
    </button>
  );

  const offeredFilters = filterOptions ?? [];
  const atFilterLimit = filterIds.length >= MAX_QUEUE_FILTERS;
  const toggleFilter = (id: string) => updateFilterIds(filterIds.includes(id) ? filterIds.filter((selected) => selected !== id) : [...filterIds, id]);

  const selectRound = (round: Round) => {
    const optionIds = offeredFilters.filter((option) => filterIds.includes(option.id)).map((option) => option.id);
    onSelect(round, direction, optionIds.length > 0 ? { optionIds, mode: optionIds.length > 1 ? filterMatch : 'any' } : undefined);
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] md:min-h-dvh bg-canvas flex items-start justify-center p-6 sm:p-10">
      <div className="bg-raised rounded-xl border border-subtle p-4 sm:p-8 max-w-3xl w-full space-y-6">
        {notice && <Callout tone="error" role="alert">{notice}</Callout>}
        <p className="text-size-sm text-secondary">Choose a round to start reviewing applications.</p>

        <div>
          <p className="text-size-xs font-semibold uppercase tracking-wide text-secondary mb-2">Review from</p>
          <div className="flex gap-1 bg-canvas border border-subtle rounded-lg p-1">
            {segmentButton('Top of pile', direction === 'top', () => updateDirection('top'))}
            {segmentButton('Bottom of pile', direction === 'bottom', () => updateDirection('bottom'))}
          </div>
        </div>

        {offeredFilters.length > 0 && (
          <fieldset>
            <legend className="text-size-xs font-semibold uppercase tracking-wide text-secondary mb-2">Only show applicants matching</legend>
            {/* Long option lists scroll inside the card so the rounds stay in view. */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto overscroll-contain">
              {offeredFilters.map((option) => {
                const checked = filterIds.includes(option.id);
                const blocked = !checked && atFilterLimit;
                let stateClasses = 'border-subtle cursor-pointer hover:border-accent';
                if (checked) stateClasses = 'border-accent bg-tint cursor-pointer';
                else if (blocked) stateClasses = 'border-subtle cursor-not-allowed opacity-50';
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-2 min-h-11 max-w-full px-3 py-2 rounded-lg border transition-colors ${stateClasses}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={blocked}
                      onChange={() => toggleFilter(option.id)}
                      className="size-4 shrink-0 accent-accent"
                    />
                    <span className="min-w-0 break-words text-size-sm text-primary">{option.label}</span>
                  </label>
                );
              })}
            </div>
            {filterIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                {filterIds.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span id="filter-match-label" className="text-size-xs text-secondary">Match</span>
                    <div role="group" aria-labelledby="filter-match-label" className="flex gap-1 bg-canvas border border-subtle rounded-lg p-1">
                      {segmentButton('Any', filterMatch === 'any', () => updateFilterMatch('any'))}
                      {segmentButton('All', filterMatch === 'all', () => updateFilterMatch('all'))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => updateFilterIds([])}
                  className="min-h-11 px-3 rounded-md text-size-sm font-medium text-secondary hover:text-primary underline underline-offset-2"
                >
                  Clear
                </button>
                {atFilterLimit && <p className="text-size-xs text-secondary">You can tick up to {MAX_QUEUE_FILTERS} at a time.</p>}
              </div>
            )}
          </fieldset>
        )}

        {rounds.length === 0 ? (
          <p className="text-size-sm text-secondary">No active or future rounds found.</p>
        ) : (
          <div className="space-y-2">
            {ALLOWED_COURSES.filter((c) => grouped[c]?.length).map((courseName) => (
              <details key={courseName} open className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-11">
                  <span className="text-size-xs font-semibold text-secondary">{courseName}</span>
                  <FaChevronDown className="size-2.5 text-secondary transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <div className="space-y-2 mt-2">
                  {grouped[courseName]!.slice(0, ROUNDS_PER_COURSE).map((round) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => selectRound(round)}
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
