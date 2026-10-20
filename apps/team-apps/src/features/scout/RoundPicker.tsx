import type { Course, InvitedThisWeek, QueueItem } from './types';
import {
  backlogFor, courses, mustLookFor, roundKey, roundPickerLabel, roundsFor,
} from './reviewQueue';
import { panel } from './reviewStyles';

const invitedLabel = (entry?: { total: number; viaApp: number }) => {
  if (!entry || entry.total === 0) return 'none invited this week';
  return `${entry.total} invited this week${entry.viaApp > 0 ? ` (${entry.viaApp} via the app)` : ''}`;
};

const choice = 'flex min-h-14 w-full items-center justify-between gap-3 rounded-surface border border-subtle px-4 py-3 text-left text-size-sm font-medium hover:border-accent hover:bg-tint';

// A lead's own courses open first; with no known courses everything is open.
export const RoundPicker = ({
  items, invited, leadCourses, onSelect, onSelectMustLook,
}: { items: QueueItem[]; invited: InvitedThisWeek; leadCourses: readonly Course[]; onSelect: (item: QueueItem) => void; onSelectMustLook: (course: Course) => void }) => (
  <section aria-label="Choose a queue" className={`${panel} mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-8`}>
    <div><h2 className="text-size-md font-semibold">Clear your must-look queue, then the backlog if you have time.</h2><p className="mt-2 text-size-sm leading-relaxed text-secondary">Counts show people waiting in the Scout queue. Must look is one queue per course across rounds; the backlog is picked round by round.</p></div>
    <div className="space-y-4">{courses.map((course) => {
      const mustLook = mustLookFor(items, course);
      const backlog = backlogFor(items, course);
      return (
        <details key={course} open={leadCourses.length === 0 || leadCourses.includes(course)}>
          <summary className="min-h-11 cursor-pointer py-3 text-size-sm font-semibold text-secondary">{course} <span className="font-normal">· {mustLook.length + backlog.length} to review · {invitedLabel(invited[course])}</span></summary>
          <div className="space-y-2">
            {mustLook.length > 0
              ? <button type="button" data-testid={`choose-must-look-${course}`} onClick={() => onSelectMustLook(course)} className={choice}><span>Must look</span><span className="shrink-0 text-size-xs text-secondary">{mustLook.length} to review →</span></button>
              : <p className="py-2 text-size-xs text-secondary">Must look is clear.</p>}
            <p className="pt-2 text-size-xs font-medium text-secondary">Backlog, if you have time</p>
            {backlog.length === 0 && <p className="py-2 text-size-xs text-secondary">Nobody in the backlog right now.</p>}
            {roundsFor(backlog, course).map((item) => <button key={roundKey(item)} type="button" data-testid={`choose-round-${roundKey(item)}`} onClick={() => onSelect(item)} className={choice}><span>{roundPickerLabel(item)}</span><span className="shrink-0 text-size-xs text-secondary">{backlog.filter((p) => roundKey(p) === roundKey(item)).length} to review →</span></button>)}
          </div>
        </details>
      );
    })}
    </div>
  </section>
);
