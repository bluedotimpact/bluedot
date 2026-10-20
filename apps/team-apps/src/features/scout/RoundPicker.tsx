import {
  PICK_REASONS, type Course, type InvitedThisWeek, type PickReason, type QueueItem,
} from './types';
import {
  backlogFor, courses, mustLookFor, roundKey, roundPickerLabel, roundsFor,
} from './reviewQueue';
import { panel } from './reviewStyles';

const choice = 'flex min-h-14 w-full items-center justify-between gap-3 rounded-surface border px-4 py-3 text-left text-size-sm font-medium';
const backlogChoice = `${choice} border-subtle hover:border-accent hover:bg-tint`;
// The shortlist is the queue to clear, so it is the one that stands out (the emphasised-choice
// colours RatingButtons uses)
const mustLookChoice = `${choice} border-accent bg-info-bg text-info-fg hover:border-strong`;

// A course's one-line summary: what the lead must look at, and what went out this week
const summaryLabel = (mustLook: number, invited?: { total: number }) => `${mustLook} shortlisted · ${invited?.total ?? 0} invited this week`;

// What is on the shortlist, one count per person so the parts add up to the total. Exported for tests.
const PICK_LABELS: Record<PickReason, string> = { 'strong yes': 'strong yes', 'good 1-1': 'positive facilitator 1-1 takes', 'facilitator 10': 'facilitator scores of 10/10' };
export const pickRecap = (picks: QueueItem[]) => {
  const parts = PICK_REASONS.map((reason) => ({ label: PICK_LABELS[reason], count: picks.filter((item) => item.pickReason === reason).length }));
  // Shortlisted by the Airtable formula for a signal the code does not know: shown rather than dropped, so the parts always add up
  parts.push({ label: 'other', count: picks.filter((item) => item.pickReason === undefined).length });
  return parts.filter(({ count }) => count > 0).map(({ label, count }) => `${count} ${label}`).join(' · ');
};

// A lead's own courses open first; with no known courses everything is open.
export const RoundPicker = ({
  items, invited, leadCourses, onSelect, onSelectMustLook,
}: { items: QueueItem[]; invited: InvitedThisWeek; leadCourses: readonly Course[]; onSelect: (item: QueueItem) => void; onSelectMustLook: (course: Course) => void }) => (
  <section aria-label="Choose a queue" className={`${panel} mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-8`}>
    <div><h2 className="text-size-md font-semibold">Clear your shortlist today!</h2><p className="mt-1 text-size-sm text-secondary">Do you want to invite more people? Check the backlog.</p></div>
    <div className="space-y-4">{courses.map((course) => {
      const mustLook = mustLookFor(items, course);
      const recap = pickRecap(mustLook);
      const backlog = backlogFor(items, course);
      return (
        <details key={course} open={leadCourses.length === 0 || leadCourses.includes(course)}>
          <summary className="min-h-11 cursor-pointer py-3 text-size-sm font-semibold text-secondary">{course} <span className="font-normal">· {summaryLabel(mustLook.length, invited[course])}</span></summary>
          <div className="space-y-2">
            {mustLook.length > 0
              ? (
                <button type="button" data-testid={`choose-must-look-${course}`} onClick={() => onSelectMustLook(course)} className={mustLookChoice}>
                  <span className="flex min-w-0 flex-col gap-0.5"><span>Shortlist</span>{recap && <span className="text-size-xs font-normal text-primary">{recap}</span>}</span>
                  <span className="shrink-0 text-size-xs">{mustLook.length} to review →</span>
                </button>
              )
              : <p className="py-2 text-size-xs text-secondary">Shortlist is clear.</p>}
            {/* Closed by default and a verb, not a name: the backlog is optional, and a long list of rounds reads as work owed */}
            <details className="group pl-2">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-size-xs text-secondary underline underline-offset-2 hover:text-primary [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show backlog ({backlog.length} people in {roundsFor(backlog, course).length} rounds)</span>
                <span className="hidden group-open:inline">Hide backlog</span>
              </summary>
              <div className="space-y-2 pl-4 pt-1">
                {backlog.length === 0 && <p className="py-2 text-size-xs text-secondary">Nobody in the backlog right now.</p>}
                {roundsFor(backlog, course).map((item) => <button key={roundKey(item)} type="button" data-testid={`choose-round-${roundKey(item)}`} onClick={() => onSelect(item)} className={backlogChoice}><span>{roundPickerLabel(item)}</span><span className="shrink-0 text-size-xs text-secondary">{backlog.filter((p) => roundKey(p) === roundKey(item)).length} to review →</span></button>)}
              </div>
            </details>
          </div>
        </details>
      );
    })}
    </div>
  </section>
);
