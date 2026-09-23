import { useId } from 'react';
import type { QueueItem } from './types';
import { roundLabel } from './reviewQueue';

const MAX_RESULTS = 8;

// Matches on name or email, case-insensitively, once two characters are typed
export const searchQueue = (items: QueueItem[], query: string): QueueItem[] => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return items.filter((item) => (item.name ?? '').toLowerCase().includes(q) || (item.email ?? '').toLowerCase().includes(q));
};

// Look one person up by name or email (the email matches but is not shown, the line is
// busy enough). One line per registration, so someone who took two courses appears twice.
export const PersonSearch = ({
  items, query, onQueryChange, onSelect,
}: { items: QueueItem[]; query: string; onQueryChange: (value: string) => void; onSelect: (item: QueueItem) => void }) => {
  const inputId = useId();
  const results = searchQueue(items, query);
  const active = query.trim().length >= 2;
  return (
    <section aria-label="Find a participant" className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-size-xs font-medium text-secondary">Find a participant in the queue</label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Name or email"
        autoComplete="off"
        className="min-h-11 w-full rounded-surface border border-subtle bg-raised px-3 text-size-sm text-primary placeholder:text-disabled focus:outline-none focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-focus"
      />
      {active && results.length === 0 && <p className="text-size-xs text-secondary">Nobody in the queue matches that.</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.slice(0, MAX_RESULTS).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                data-testid={`search-result-${item.id}`}
                onClick={() => onSelect(item)}
                className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-surface border border-subtle bg-raised px-3 py-2 text-left text-size-sm hover:border-accent hover:bg-tint"
              >
                <span className="font-medium">{item.name ?? 'Participant'}</span>
                <span className="ml-auto text-size-xs text-secondary">{item.course} · {roundLabel(item)}{item.opinion ? ` · ${item.opinion}` : ''}</span>
              </button>
            </li>
          ))}
          {results.length > MAX_RESULTS && <li className="text-size-xs text-secondary">{results.length - MAX_RESULTS} more, keep typing to narrow it down.</li>}
        </ul>
      )}
    </section>
  );
};
