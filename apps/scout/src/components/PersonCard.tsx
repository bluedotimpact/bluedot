import { useState } from 'react';
import { A } from '@bluedot/ui';
import {
  type EvaluationCall, type GrantApplication, type Person, type Registration,
} from '../lib/client/types';

// Airtable's colours for Human opinion, so the card reads like the base does.
const OPINION_STYLE: Record<string, string> = {
  'Strong yes': 'bg-green-200 text-green-900',
  'Weak yes': 'bg-green-100 text-green-800',
  Neutral: 'bg-gray-200 text-gray-800',
  'Weak no': 'bg-orange-100 text-orange-800',
  'Strong no': 'bg-red-200 text-red-900',
};

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'bg-gray-100 text-gray-800' }) => (
  <span className={`inline-block rounded px-2 py-0.5 text-size-xs font-medium ${className}`}>{children}</span>
);

const OpinionBadge: React.FC<{ opinion?: string }> = ({ opinion }) => (
  opinion ? <Badge className={OPINION_STYLE[opinion] ?? 'bg-gray-100 text-gray-800'}>{opinion}</Badge> : null
);

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const PREVIEW_WORDS = 40;

// A labelled answer: the question, then the first few dozen words, expandable.
const Answer: React.FC<{ label: string; text?: string }> = ({ label, text }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  const long = words.length > PREVIEW_WORDS;
  const shown = open || !long ? text : `${words.slice(0, PREVIEW_WORDS).join(' ')}…`;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-size-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="whitespace-pre-wrap text-size-sm leading-relaxed">
        {shown}
        {long && (
          <button type="button" className="ml-1 text-size-xs text-gray-500 underline" onClick={() => setOpen((o) => !o)}>
            {open ? 'less' : 'more'}
          </button>
        )}
      </p>
    </div>
  );
};

const Section: React.FC<{ title: string; count?: number; open?: boolean; children: React.ReactNode }> = ({
  title, count, open = false, children,
}) => (
  <details className="rounded border border-gray-200" open={open}>
    <summary className="cursor-pointer select-none px-4 py-2 text-size-sm font-semibold">
      {title}{count !== undefined && <span className="ml-1 font-normal text-gray-500">({count})</span>}
    </summary>
    <div className="flex flex-col gap-4 px-4 pb-4">{children}</div>
  </details>
);

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
  if (r.hasCertificate) return <Badge className="bg-blue-100 text-blue-900">Completed</Badge>;
  if (r.droppedOut) return <Badge className="bg-red-100 text-red-900">Dropped out</Badge>;
  if (r.roundEnd && new Date(r.roundEnd) < new Date()) return <Badge className="bg-red-100 text-red-900">Not completed</Badge>;
  return null;
};

const HistoryRow: React.FC<{ r: Registration }> = ({ r }) => (
  <div className={`flex flex-wrap items-center gap-2 text-size-sm ${r.isCurrent ? 'font-semibold' : ''}`}>
    <span className="min-w-[10rem]">{r.course}</span>
    <span className="text-gray-600">{r.roundName.replace(/^.*?\(/, '(')}</span>
    {r.facilitated && <Badge className="bg-purple-100 text-purple-900">Facilitator</Badge>}
    <OpinionBadge opinion={r.opinion} />
    <CompletionBadge r={r} />
    {r.isCurrent && <span className="text-size-xs text-gray-500">← this one</span>}
  </div>
);

const GrantRow: React.FC<{ g: GrantApplication }> = ({ g }) => (
  <div className="flex flex-col gap-1 text-size-sm">
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-[10rem]">Career transition grant</span>
      <span className="text-gray-600">{formatDate(g.decisionDate ?? g.createdAt)}</span>
      {g.status && <Badge className={/reject/i.test(g.status) ? 'bg-red-100 text-red-900' : 'bg-yellow-100 text-yellow-900'}>{g.status}</Badge>}
      {g.amountUsd !== undefined && <span className="text-gray-600">${g.amountUsd.toLocaleString()}</span>}
    </div>
    {g.reasoning && (
      <details className="ml-4">
        <summary className="cursor-pointer text-size-xs text-gray-500">why ›</summary>
        <p className="whitespace-pre-wrap pt-1 text-size-sm leading-relaxed">{g.reasoning}</p>
      </details>
    )}
  </div>
);

const CallRow: React.FC<{ c: EvaluationCall }> = ({ c }) => (
  <div className="flex flex-wrap items-center gap-2 text-size-sm">
    <span className="min-w-[10rem]">Evaluation call</span>
    <span className="text-gray-600">{formatDate(c.callDate ?? c.createdAt)}</span>
    {c.status && <Badge className="bg-yellow-100 text-yellow-900">{c.status}</Badge>}
    <OpinionBadge opinion={c.opinion} />
    {c.notesUrl && <A href={c.notesUrl} target="_blank" rel="noreferrer" className="text-size-xs">notes ↗</A>}
  </div>
);

export const PersonCard: React.FC<{ person: Person; showName: boolean }> = ({ person, showName }) => {
  const profileLinks = [person.profileUrl, person.application?.otherProfileUrl].filter((u): u is string => !!u);
  const summaryLine = [person.jobTitle, person.organisation, person.country].filter(Boolean).join(' · ');
  const withBlueDotCount = person.history.length + person.grants.length + person.calls.length;
  const app = person.application;
  const appHeader = app ? [app.careerLevel, app.profession, app.fieldOfStudy?.join(', ')].filter(Boolean).join(' · ') : '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-size-lg font-semibold">{showName ? person.name : 'Participant'}</span>
          <OpinionBadge opinion={person.opinion} />
          {person.certificateUrl && <Badge className="bg-blue-100 text-blue-900">Completed</Badge>}
          {person.reports.length > 0 && <Badge className="bg-purple-100 text-purple-900">Facilitator 1:1 report</Badge>}
          {person.calls.length > 0 && <Badge className="bg-yellow-100 text-yellow-900">Had an evaluation call</Badge>}
          {person.grants.length > 0 && <Badge className="bg-yellow-100 text-yellow-900">Applied for a grant</Badge>}
        </div>
        {summaryLine && <p className="text-size-sm text-gray-700">{summaryLine}</p>}
        <p className="text-size-sm text-gray-600">{person.course} · {person.roundName} · ended {formatDate(person.roundEnd)}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {profileLinks.map((u) => (
            <A key={u} href={u} target="_blank" rel="noreferrer" className="rounded border border-gray-300 bg-white px-3 py-1 text-size-sm no-underline hover:bg-gray-100">
              {hostLabel(u)} ↗
            </A>
          ))}
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-3 py-1 text-size-sm hover:bg-gray-100"
            onClick={() => navigator.clipboard.writeText(person.email)}
          >
            Copy email
          </button>
        </div>
      </div>

      <Section title="With BlueDot" count={withBlueDotCount} open>
        {person.history.map((r) => <HistoryRow key={r.id} r={r} />)}
        {person.grants.map((g) => <GrantRow key={g.id} g={g} />)}
        {person.calls.map((c) => <CallRow key={c.id} c={c} />)}
        {withBlueDotCount === 0 && <p className="text-size-sm text-gray-500">No registrations found for this email.</p>}
      </Section>

      <Section title="Application">
        {app ? (
          <>
            {appHeader && <p className="text-size-sm text-gray-600">{appHeader}</p>}
            <Answer label="Imagine you're at the end of the course and it's been a wild success. How is your life different?" text={app.pathToImpact} />
            <Answer label="How have you engaged with the field so far?" text={app.experience} />
            <Answer label="What skills will you contribute?" text={app.skills} />
            <Answer label="Tell us about one achievement you're most proud of" text={app.impressiveProject} />
            <Answer label="What's the hardest tradeoff or tension you see in the field?" text={app.reasoning} />
            <Answer label="Where did you hear about this course?" text={app.source} />
            <Answer label="Speed-review summary (AI, at application time)" text={app.aiSummary} />
          </>
        ) : <p className="text-size-sm text-gray-500">No application linked to this registration.</p>}
      </Section>

      <Section title="Project">
        {person.projects.length === 0 && <p className="text-size-sm text-gray-500">No project submitted.</p>}
        {person.projects.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <p className="text-size-sm font-medium">{p.url ? <A href={p.url} target="_blank" rel="noreferrer">{p.title ?? p.url} ↗</A> : p.title}</p>
            {p.evalNotes.map((n, i) => <Answer key={n} label={`Evaluator notes ${p.evalNotes.length > 1 ? i + 1 : ''}`} text={n} />)}
          </div>
        ))}
      </Section>

      {person.reports.length > 0 && (
        <Section title="Facilitator 1:1 report">
          {person.reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-size-xs text-gray-600">
                <span>{formatDate(r.date)}</span>
                {r.round && <span>· {r.round}</span>}
                {r.nextSteps.map((s) => <Badge key={s}>{s}</Badge>)}
                {r.docUrl && <A href={r.docUrl} target="_blank" rel="noreferrer">full report ↗</A>}
              </div>
              <Answer label="Quick take" text={r.quickTake} />
              <Answer label="Anything else" text={r.anythingElse} />
            </div>
          ))}
        </Section>
      )}

      <Section title="Facilitator feedback">
        {person.facilitatorFeedback.length === 0 && <p className="text-size-sm text-gray-500">The facilitator left no feedback on this participant.</p>}
        {person.facilitatorFeedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-size-xs text-gray-600">
              {fb.rating !== undefined && <span className="text-size-sm font-semibold text-gray-900">{fb.rating}/10</span>}
              {fb.oneOnOneRating && <Badge className="bg-purple-100 text-purple-900">{fb.oneOnOneRating}</Badge>}
              {fb.recommendToFacilitate && <Badge className="bg-purple-100 text-purple-900">Recommended to facilitate</Badge>}
              {fb.motivation && <span>· x-risk motivated: {fb.motivation}</span>}
              {fb.reviewer && <span>· {fb.reviewer}</span>}
              {fb.round && <span>· {fb.round}</span>}
            </div>
            {fb.nextSteps.length > 0 && <div className="flex flex-wrap gap-1">{fb.nextSteps.map((s) => <Badge key={s}>{s.replace(/^\[!\] /, '')}</Badge>)}</div>}
            <Answer label="Private feedback" text={fb.feedback} />
          </div>
        ))}
      </Section>

      <Section title="Course feedback">
        {person.feedback.length === 0 && <p className="text-size-sm text-gray-500">No end-of-course feedback.</p>}
        {person.feedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-size-xs text-gray-600">
              {fb.rating !== undefined && <span>Rating {fb.rating}</span>}
              {fb.timeSpent !== undefined && <span>· {fb.timeSpent} h/week</span>}
              {fb.futureFacilitate && <span>· would facilitate: {fb.futureFacilitate}</span>}
            </div>
            <Answer label="What they got out of the course" text={fb.courseValue} />
            <Answer label="What changed their mind" text={fb.changeMind} />
            <Answer label="What they'd improve" text={fb.improvements} />
          </div>
        ))}
      </Section>
    </div>
  );
};
