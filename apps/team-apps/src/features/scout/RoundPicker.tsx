import { useState } from 'react';
import {
  PICK_REASONS, type Course, type PickReason, type QueueItem,
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

// What is on the shortlist, one count per person so the parts add up to the total. Exported for tests.
const PICK_LABELS: Record<PickReason, string> = { 'strong yes': 'strong yes', endorsement: 'facilitator endorsements', 'top score': 'high facilitator feedback' };
export const pickRecap = (picks: QueueItem[]) => {
  const parts = PICK_REASONS.map((reason) => ({ label: PICK_LABELS[reason], count: picks.filter((item) => item.pickReason === reason).length }));
  // Shortlisted by the Airtable formula for a signal the code does not know: shown rather than dropped, so the parts always add up
  parts.push({ label: 'other', count: picks.filter((item) => item.pickReason === undefined).length });
  return parts.filter(({ count }) => count > 0).map(({ label, count }) => `${count} ${label}`).join(' · ');
};

type Pick = { onSelect: (item: QueueItem) => void; onSelectMustLook: (course: Course) => void };

// One course: its shortlist, or once that is clear, the backlog round by round
const CourseBox = ({
  items, course, onSelect, onSelectMustLook, onClose,
}: Pick & { items: QueueItem[]; course: Course; onClose?: () => void }) => {
  const mustLook = mustLookFor(items, course);
  const recap = pickRecap(mustLook);
  const backlog = backlogFor(items, course);
  const rounds = roundsFor(backlog, course);
  return (
    <section aria-label={course} className={`${panel} space-y-2 p-4 sm:p-5 ${onClose ? 'border-dashed' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-size-sm font-semibold text-secondary">{course}</h2>
        {onClose && <button type="button" onClick={onClose} className="min-h-11 text-size-xs text-secondary hover:text-primary">Close ×</button>}
      </div>
      {mustLook.length > 0
        ? (
          <button type="button" data-testid={`choose-must-look-${course}`} onClick={() => onSelectMustLook(course)} className={mustLookChoice}>
            <span className="flex min-w-0 flex-col gap-0.5"><span>Shortlist</span>{recap && <span className="text-size-xs font-normal text-primary">{recap}</span>}</span>
            <span className="shrink-0 text-size-xs">{mustLook.length} to review →</span>
          </button>
        )
        : (
          <>
            <p className="rounded-surface border border-success-border bg-success-bg px-4 py-3 text-size-sm font-medium text-success-fg"><span aria-hidden>✓ </span>Shortlist clear</p>
            {/* Offered only once the shortlist is clear: until then the shortlist is the one thing to do */}
            {rounds.length > 0 && (
              <details className="group">
                <summary className={`${backlogChoice} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                  <span className="flex min-w-0 flex-col gap-0.5"><span>Backlog</span><span className="text-size-xs font-normal text-secondary">More people by round</span></span>
                  <span className="shrink-0 text-size-xs text-secondary">{backlog.length} in {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'} <span className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden>→</span></span>
                </summary>
                <div className="space-y-2 pl-4 pt-2">
                  {rounds.map((item) => <button key={roundKey(item)} type="button" data-testid={`choose-round-${roundKey(item)}`} onClick={() => onSelect(item)} className={backlogChoice}><span>{roundPickerLabel(item)}</span><span className="shrink-0 text-size-xs text-secondary">{backlog.filter((p) => roundKey(p) === roundKey(item)).length} to review →</span></button>)}
                </div>
              </details>
            )}
          </>
        )}
    </section>
  );
};

// The lead's own courses, then the rest as a quiet row of names that open one course at a time.
// Someone who leads no course sees every course as their own.
export const RoundPicker = ({
  items, leadCourses, onSelect, onSelectMustLook,
}: Pick & { items: QueueItem[]; leadCourses: readonly Course[] }) => {
  const [openOther, setOpenOther] = useState<Course>();
  const own = leadCourses.length === 0 ? courses : courses.filter((course) => leadCourses.includes(course));
  const others = courses.filter((course) => !own.includes(course));
  return (
    <div className="flex flex-col gap-4">
      {own.map((course) => <CourseBox key={course} items={items} course={course} onSelect={onSelect} onSelectMustLook={onSelectMustLook} />)}
      {others.length > 0 && (
        <nav aria-label="Other courses" className="flex flex-col items-center gap-2 pt-1">
          <p className="text-size-xs text-secondary">Browse other courses</p>
          <div className="flex flex-wrap justify-center gap-2">
            {others.map((course) => (
              <button key={course} type="button" aria-pressed={openOther === course} onClick={() => setOpenOther(openOther === course ? undefined : course)} className={`min-h-9 rounded-full border px-3 text-size-xs ${openOther === course ? 'border-primary font-semibold text-primary' : 'border-subtle bg-raised text-secondary hover:text-primary'}`}>{course}</button>
            ))}
          </div>
        </nav>
      )}
      {openOther && <CourseBox items={items} course={openOther} onSelect={onSelect} onSelectMustLook={onSelectMustLook} onClose={() => setOpenOther(undefined)} />}
    </div>
  );
};
