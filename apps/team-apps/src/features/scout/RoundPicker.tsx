import type { QueueItem } from './types';
import {
  courses, roundKey, roundLabel, roundsFor,
} from './reviewQueue';
import { panel } from './reviewStyles';

export const RoundPicker = ({ items, onSelect }: { items: QueueItem[]; onSelect: (item: QueueItem) => void }) => (
  <section aria-label="Choose a round" className={`${panel} mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-8`}>
    <div><h2 className="text-size-md font-semibold">Choose a round to start reviewing.</h2><p className="mt-2 text-size-sm leading-relaxed text-secondary">Counts show people waiting in the Scout queue. Choose a course round to work through.</p></div>
    <div className="space-y-4">{courses.map((course) => <details key={course} open><summary className="min-h-11 cursor-pointer py-3 text-size-sm font-semibold text-secondary">{course} <span className="font-normal">· {items.filter((item) => item.course === course).length} to review</span></summary><div className="space-y-2">{roundsFor(items, course).map((item) => <button key={roundKey(item)} type="button" data-testid={`choose-round-${roundKey(item)}`} onClick={() => onSelect(item)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-surface border border-subtle px-4 py-3 text-left text-size-sm font-medium hover:border-accent hover:bg-tint"><span>{roundLabel(item)}</span><span className="shrink-0 text-size-xs text-secondary">{items.filter((p) => roundKey(p) === roundKey(item)).length} to review →</span></button>)}{roundsFor(items, course).length === 0 && <p className="py-2 text-size-xs text-secondary">No rounds from this course in the current Scout queue.</p>}</div></details>)}</div>
  </section>
);
