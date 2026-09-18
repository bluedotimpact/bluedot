import { type ReactNode, useState } from 'react';
import {
  A, CardShell, ChevronRightIcon, cn, CTALinkOrButton, P,
} from '@bluedot/ui';
import {
  type EvaluationCall, type GrantApplication, type Person, type Registration,
} from '../lib/client/types';

const APPLICATIONS_BASE_ID = 'appnJbsG1eWbAdEvf';
const APPLICATIONS_TABLE_ID = 'tblXKnWoXK3R63F6D';

// Airtable's colours for Human opinion, so the card reads like the base does.
const OPINION_STYLE: Record<string, string> = {
  'Strong yes': 'bg-green-200 text-green-900',
  'Weak yes': 'bg-green-100 text-green-800',
  Neutral: 'bg-gray-200 text-gray-800',
  'Weak no': 'bg-orange-100 text-orange-800',
  'Strong no': 'bg-red-200 text-red-900',
};

const Badge: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = 'bg-tint text-primary' }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-size-xxs font-medium ${className}`}>{children}</span>
);

const OpinionBadge: React.FC<{ opinion?: string }> = ({ opinion }) => (
  opinion ? <Badge className={OPINION_STYLE[opinion] ?? 'bg-tint text-primary'}>{opinion}</Badge> : null
);

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Drops the course name from "Technical AI Safety (2026 Aug W32) - Part-time"
const shortRound = (name: string) => name.replace(/^.*?(?=\()/, '');

// The one expand/collapse affordance: chevron in front, whole line clickable.
// State is tracked here rather than via `group-open:` because disclosures nest
// (answers inside sections) and Tailwind's group variant would match the outer one.
// `preview` only shows while collapsed.
const Disclosure: React.FC<{
  summary: ReactNode; preview?: ReactNode; defaultOpen?: boolean; summaryClassName?: string; bodyClassName?: string; children: ReactNode;
}> = ({
  summary, preview, defaultOpen = false, summaryClassName, bodyClassName, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className={cn('flex cursor-pointer select-none list-none items-center gap-2 rounded-surface text-size-sm marker:hidden [&::-webkit-details-marker]:hidden hover:bg-tint focus-visible:outline-2 focus-visible:outline-focus', summaryClassName)}>
        <ChevronRightIcon size={16} aria-hidden className={cn('shrink-0 text-secondary transition-transform motion-reduce:transition-none', open && 'rotate-90')} />
        {summary}
        {!open && preview}
      </summary>
      {open && <div className={bodyClassName}>{children}</div>}
    </details>
  );
};

// A question with its answer. Collapsed: the label and the first line of the answer.
const Answer: React.FC<{ label: string; text?: string }> = ({ label, text }) => (
  text ? (
    <Disclosure
      summary={<span className="shrink-0 font-medium text-secondary">{label}</span>}
      preview={<span className="min-w-0 truncate text-primary">{text.replace(/\s+/g, ' ')}</span>}
      bodyClassName="pl-6 pt-1"
    >
      <P className="whitespace-pre-wrap">{text}</P>
    </Disclosure>
  ) : null
);

// Section header carries the summary (count, score, rating) so most sections
// never need opening. Empty sections are greyed and cannot be opened.
const Section: React.FC<{
  title: string; meta?: ReactNode; empty?: boolean; emptyText?: string; defaultOpen?: boolean; children?: ReactNode;
}> = ({
  title, meta, empty = false, emptyText = 'none', defaultOpen = false, children,
}) => (
  empty ? (
    <CardShell className="px-4 py-2 pl-10 text-size-sm text-disabled">{title} — {emptyText}</CardShell>
  ) : (
    <CardShell className="p-0">
      <Disclosure
        defaultOpen={defaultOpen}
        summary={<><span className="font-semibold text-primary">{title}</span>{meta}</>}
        summaryClassName="flex-wrap gap-x-3 gap-y-1 px-4 py-2"
        bodyClassName="flex flex-col gap-3 px-4 pb-3 pl-10"
      >
        {children}
      </Disclosure>
    </CardShell>
  )
);

const Meta: React.FC<{ children: ReactNode }> = ({ children }) => <span className="font-normal text-secondary">{children}</span>;

const hostLabel = (u: string) => {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '');
    if (h.includes('linkedin')) return 'LinkedIn';
    if (h === 'github.com') return 'GitHub';
    if (h.includes('scholar.google')) return 'Google Scholar';
    return h;
  } catch {
    return 'Profile';
  }
};

const CompletionBadge: React.FC<{ r: Registration }> = ({ r }) => {
  if (r.hasCertificate) return <Badge className="bg-info-bg text-info-fg">Completed</Badge>;
  if (r.droppedOut) return <Badge className="bg-error-bg text-error-fg">Dropped out</Badge>;
  if (r.roundEnd && new Date(r.roundEnd) < new Date()) return <Badge className="bg-error-bg text-error-fg">Not completed</Badge>;
  return null;
};

// Three aligned columns: what · when · badges. Stacks on narrow screens so the page never scrolls sideways.
const Row: React.FC<{ what: ReactNode; when: ReactNode; bold?: boolean; children?: ReactNode }> = ({
  what, when, bold = false, children,
}) => (
  <div className={`grid grid-cols-1 items-center gap-x-3 gap-y-1 text-size-sm text-primary sm:grid-cols-[minmax(9rem,12rem)_minmax(8rem,14rem)_1fr] ${bold ? 'font-semibold' : ''}`}>
    <span className="truncate">{what}</span>
    <span className="truncate text-secondary">{when}</span>
    <span className="flex flex-wrap items-center gap-1">{children}</span>
  </div>
);

const HistoryRow: React.FC<{ r: Registration }> = ({ r }) => (
  <Row what={r.course} when={shortRound(r.roundName)} bold={r.isCurrent}>
    {r.facilitated && <Badge>Facilitator</Badge>}
    <OpinionBadge opinion={r.opinion} />
    <CompletionBadge r={r} />
    {r.isCurrent && <span className="text-size-xxs font-normal text-secondary">← this one</span>}
  </Row>
);

const GrantRow: React.FC<{ g: GrantApplication }> = ({ g }) => (
  <div className="flex flex-col gap-1">
    <Row what="Career transition grant" when={formatDate(g.decisionDate ?? g.createdAt)}>
      {g.status && <Badge className={/reject/i.test(g.status) ? 'bg-error-bg text-error-fg' : 'bg-warning-bg text-warning-fg'}>{g.status}</Badge>}
      {g.amountUsd !== undefined && <span className="text-secondary">${g.amountUsd.toLocaleString()}</span>}
    </Row>
    <Answer label="Why" text={g.reasoning} />
  </div>
);

const CallRow: React.FC<{ c: EvaluationCall }> = ({ c }) => (
  <Row what="Evaluation call" when={formatDate(c.callDate ?? c.createdAt)}>
    {c.status && <Badge className="bg-warning-bg text-warning-fg">{c.status}</Badge>}
    <OpinionBadge opinion={c.opinion} />
    {c.notesUrl && <A href={c.notesUrl} target="_blank" className="text-size-xs">notes ↗</A>}
  </Row>
);

export const PersonCard: React.FC<{ person: Person; showName: boolean }> = ({ person, showName }) => {
  const profileLinks = [person.profileUrl, person.application?.otherProfileUrl].filter((u): u is string => !!u);
  const summaryLine = [person.jobTitle, person.organisation, person.country].filter(Boolean).join(' · ');
  const withBlueDotCount = person.history.length + person.grants.length + person.calls.length;
  const app = person.application;
  const applicationUrl = app ? `https://airtable.com/${APPLICATIONS_BASE_ID}/${APPLICATIONS_TABLE_ID}/${app.id}` : undefined;
  const appHeader = app ? [app.careerLevel, app.profession, app.fieldOfStudy?.join(', ')].filter(Boolean).join(' · ') : '';
  const roundLine = `${shortRound(person.roundName)} · ended ${formatDate(person.roundEnd)}`;

  return (
    <div className="flex flex-col gap-2">
      <CardShell className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-size-md font-semibold text-primary">{showName ? person.name : 'Participant'}</span>
          <OpinionBadge opinion={person.opinion} />
          {person.certificateUrl && <Badge className="bg-info-bg text-info-fg">Completed</Badge>}
          {person.reports.length > 0 && <Badge>Facilitator 1:1 report</Badge>}
          {person.calls.length > 0 && <Badge className="bg-warning-bg text-warning-fg">Had an evaluation call</Badge>}
          {person.grants.length > 0 && <Badge className="bg-warning-bg text-warning-fg">Applied for a grant</Badge>}
        </div>
        {summaryLine && <p className="text-size-sm text-secondary">{summaryLine}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {profileLinks.map((u) => (
            <CTALinkOrButton key={u} size="small" variant="outline-black" url={u} target="_blank">{hostLabel(u)} ↗</CTALinkOrButton>
          ))}
          <CTALinkOrButton size="small" variant="outline-black" onClick={() => navigator.clipboard.writeText(person.email)}>Copy email</CTALinkOrButton>
        </div>
      </CardShell>

      <Section title="With BlueDot" defaultOpen meta={<Meta>({withBlueDotCount})</Meta>} empty={withBlueDotCount === 0} emptyText="no registrations found for this email">
        {person.history.map((r) => <HistoryRow key={r.id} r={r} />)}
        {person.grants.map((g) => <GrantRow key={g.id} g={g} />)}
        {person.calls.map((c) => <CallRow key={c.id} c={c} />)}
      </Section>

      <Section
        title="Application"
        empty={!app}
        emptyText="not linked to this registration"
        meta={(
          <>
            <Meta>{roundLine}</Meta>
            {applicationUrl && <A href={applicationUrl} target="_blank" className="text-size-xs">open in Airtable ↗</A>}
          </>
        )}
      >
        {app && (
          <>
            {appHeader && <p className="text-size-sm text-secondary">{appHeader}</p>}
            <Answer label="End of course, wild success — how is life different?" text={app.pathToImpact} />
            <Answer label="Engagement with the field so far" text={app.experience} />
            <Answer label="Skills they'll contribute" text={app.skills} />
            <Answer label="Achievement they're most proud of" text={app.impressiveProject} />
            <Answer label="Hardest tradeoff they see" text={app.reasoning} />
            <Answer label="Heard about the course from" text={app.source} />
            <Answer label="Speed-review summary (AI)" text={app.aiSummary} />
          </>
        )}
      </Section>

      <Section
        title="Project"
        empty={person.projects.length === 0}
        emptyText="no submission"
        meta={person.projects[0]?.url && <A href={person.projects[0].url} target="_blank" className="font-normal">{person.projects[0].title ?? 'open'} ↗</A>}
      >
        {person.projects.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            {!p.url && p.title && <p className="text-size-sm font-medium text-primary">{p.title}</p>}
            {p.evalNotes.length === 0 && <p className="text-size-sm text-disabled">No evaluator notes.</p>}
            {p.evalNotes.map((n, i) => <Answer key={n} label={`Evaluator notes${p.evalNotes.length > 1 ? ` ${i + 1}` : ''}`} text={n} />)}
          </div>
        ))}
      </Section>

      {person.reports.length > 0 && (
        <Section title="Facilitator 1:1 report" meta={<Meta>{person.reports.map((r) => formatDate(r.date)).join(', ')}</Meta>}>
          {person.reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              {(r.nextSteps.length > 0 || r.docUrl) && (
                <div className="flex flex-wrap items-center gap-2 text-size-xs">
                  {r.nextSteps.map((s) => <Badge key={s}>{s}</Badge>)}
                  {r.docUrl && <A href={r.docUrl} target="_blank">full report ↗</A>}
                </div>
              )}
              <Answer label="Quick take" text={r.quickTake} />
              <Answer label="Anything else" text={r.anythingElse} />
            </div>
          ))}
        </Section>
      )}

      <Section
        title="Facilitator feedback"
        empty={person.facilitatorFeedback.length === 0}
        emptyText="the facilitator left none"
        meta={person.facilitatorFeedback.map((fb) => (
          <span key={fb.id} className="flex items-center gap-2 font-normal">
            {fb.rating !== undefined && <span className="font-semibold text-primary">{fb.rating}/10</span>}
            {fb.oneOnOneRating && <Badge>{fb.oneOnOneRating}</Badge>}
            {fb.reviewer && <Meta>{fb.reviewer}</Meta>}
          </span>
        ))}
      >
        {person.facilitatorFeedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-2">
            {(fb.recommendToFacilitate || fb.nextSteps.length > 0 || fb.motivation) && (
              <div className="flex flex-wrap items-center gap-1 text-size-xs text-secondary">
                {fb.recommendToFacilitate && <Badge>Recommended to facilitate</Badge>}
                {fb.nextSteps.map((s) => <Badge key={s}>{s.replace(/^\[!\] /, '')}</Badge>)}
                {fb.motivation && <span className="ml-1">x-risk motivated: {fb.motivation}</span>}
              </div>
            )}
            <Answer label="Private feedback" text={fb.feedback} />
          </div>
        ))}
      </Section>

      <Section
        title="Course feedback"
        empty={person.feedback.length === 0}
        emptyText="none"
        meta={person.feedback.map((fb) => (
          <Meta key={fb.id}>
            {fb.rating !== undefined && <span className="font-semibold text-primary">Rating {fb.rating}</span>}
            {fb.timeSpent !== undefined && <span> · {fb.timeSpent} h/week</span>}
            {fb.futureFacilitate && <span> · would facilitate: {fb.futureFacilitate}</span>}
          </Meta>
        ))}
      >
        {person.feedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-2">
            <Answer label="What they got out of it" text={fb.courseValue} />
            <Answer label="What changed their mind" text={fb.changeMind} />
            <Answer label="What they'd improve" text={fb.improvements} />
          </div>
        ))}
      </Section>
    </div>
  );
};
