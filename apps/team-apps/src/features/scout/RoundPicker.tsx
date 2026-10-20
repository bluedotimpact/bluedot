import type { Course, InvitedThisWeek, QueueItem } from './types';
import {
  backlogFor, courses, mustLookFor, roundKey, roundPickerLabel, roundsFor,
} from './reviewQueue';
import { panel } from './reviewStyles';

const choice = 'flex min-h-14 w-full items-center justify-between gap-3 rounded-surface border px-4 py-3 text-left text-size-sm font-medium';
const backlogChoice = `${choice} border-subtle hover:border-accent hover:bg-tint`;
// Must look is the queue to clear, so it is the one that stands out (the emphasised-choice
// colours RatingButtons uses)
const mustLookChoice = `${choice} border-accent bg-info-bg text-info-fg hover:border-strong`;

// A course's one-line summary: what the lead must look at, and what went out this week
const summaryLabel = (mustLook: number, invited?: { total: number }) => `${mustLook} must look · ${invited?.total ?? 0} invited this week`;

// A lead's own courses open first; with no known courses everything is open.
export const RoundPicker = ({
  items, invited, leadCourses, onSelect, onSelectMustLook,
}: { items: QueueItem[]; invited: InvitedThisWeek; leadCourses: readonly Course[]; onSelect: (item: QueueItem) => void; onSelectMustLook: (course: Course) => void }) => (
  <section aria-label="Choose a queue" className={`${panel} mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-8`}>
    <h2 className="text-size-md font-semibold">Clear your must-look queue, then the backlog if you have time.</h2>
    <div className="space-y-4">{courses.map((course) => {
      const mustLook = mustLookFor(items, course);
      const backlog = backlogFor(items, course);
      return (
        <details key={course} open={leadCourses.length === 0 || leadCourses.includes(course)}>
          <summary className="min-h-11 cursor-pointer py-3 text-size-sm font-semibold text-secondary">{course} <span className="font-normal">· {summaryLabel(mustLook.length, invited[course])}</span></summary>
          <div className="space-y-2">
            {mustLook.length > 0
              ? <button type="button" data-testid={`choose-must-look-${course}`} onClick={() => onSelectMustLook(course)} className={mustLookChoice}><span>Must look</span><span className="shrink-0 text-size-xs">{mustLook.length} to review →</span></button>
              : <p className="py-2 text-size-xs text-secondary">Must look is clear.</p>}
            <p className="pt-2 text-size-xs font-medium text-secondary">Backlog <span className="font-normal">· {backlog.length}</span></p>
            {backlog.length === 0 && <p className="py-2 text-size-xs text-secondary">Nobody in the backlog right now.</p>}
            {roundsFor(backlog, course).map((item) => <button key={roundKey(item)} type="button" data-testid={`choose-round-${roundKey(item)}`} onClick={() => onSelect(item)} className={backlogChoice}><span>{roundPickerLabel(item)}</span><span className="shrink-0 text-size-xs text-secondary">{backlog.filter((p) => roundKey(p) === roundKey(item)).length} to review →</span></button>)}
          </div>
        </details>
      );
    })}
    </div>
  </section>
);
