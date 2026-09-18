import { useState } from 'react';
import { A } from '@bluedot/ui';
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

// One accent per section so the eye can tell them apart at a glance.
type Accent = 'blue' | 'amber' | 'teal' | 'purple' | 'green';
const ACCENT: Record<Accent, { border: string; header: string; label: string }> = {
  blue: { border: 'border-l-blue-400', header: 'bg-blue-50', label: 'text-blue-800' },
  amber: { border: 'border-l-amber-400', header: 'bg-amber-50', label: 'text-amber-800' },
  teal: { border: 'border-l-teal-400', header: 'bg-teal-50', label: 'text-teal-800' },
  purple: { border: 'border-l-purple-400', header: 'bg-purple-50', label: 'text-purple-800' },
  green: { border: 'border-l-green-400', header: 'bg-green-50', label: 'text-green-800' },
};

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'bg-gray-100 text-gray-800' }) => (
  <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-size-xs font-medium ${className}`}>{children}</span>
);

const OpinionBadge: React.FC<{ opinion?: string }> = ({ opinion }) => (
  opinion ? <Badge className={OPINION_STYLE[opinion] ?? 'bg-gray-100 text-gray-800'}>{opinion}</Badge> : null
);

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Drops the course name from "Technical AI Safety (2026 Aug W32) - Part-time"
const shortRound = (name: string) => name.replace(/^.*?(?=\()/, '');

// A question with its answer. Collapsed: the question in colour and the first
// line of the answer, chevron in front. Click anywhere on the line to expand.
const Answer: React.FC<{ label: string; text?: string; accent: Accent }> = ({ label, text, accent }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className="flex flex-col gap-1">
      <button type="button" className="flex w-full items-baseline gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <span className="w-3 shrink-0 text-size-xs text-gray-400">{open ? '▾' : '▸'}</span>
        <span className={`shrink-0 text-size-sm font-semibold ${ACCENT[accent].label}`}>{label}</span>
        {!open && <span className="min-w-0 truncate text-size-sm text-gray-600">{text.replace(/\s+/g, ' ')}</span>}
      </button>
      {open && <p className="whitespace-pre-wrap pl-5 text-size-sm leading-relaxed">{text}</p>}
    </div>
  );
};

// Section header carries the summary (count, score, rating) so most sections
// never need opening. Empty sections are greyed and cannot be opened.
const Section: React.FC<{
  title: string; accent: Accent; meta?: React.ReactNode; empty?: boolean; emptyText?: string; open?: boolean; children?: React.ReactNode;
}> = ({
  title, accent, meta, empty = false, emptyText = 'none', open = false, children,
}) => {
  if (empty) {
    return (
      <div className="rounded border border-gray-200 border-l-4 border-l-gray-200 px-4 py-2 text-size-sm text-gray-400">
        {title} <span className="ml-1">— {emptyText}</span>
      </div>
    );
  }

  return (
    <details className={`rounded border border-gray-200 border-l-4 ${ACCENT[accent].border}`} open={open}>
      <summary className={`flex cursor-pointer select-none flex-wrap items-center gap-x-3 gap-y-1 rounded-r px-4 py-2 text-size-sm ${ACCENT[accent].header}`}>
        <span className={`font-semibold ${ACCENT[accent].label}`}>{title}</span>
        {meta}
      </summary>
      <div className="flex flex-col gap-3 px-4 py-3">{children}</div>
    </details>
  );
};

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

// Three aligned columns: what · when · badges
const Row: React.FC<{ what: React.ReactNode; when: React.ReactNode; bold?: boolean; children?: React.ReactNode }> = ({
  what, when, bold = false, children,
}) => (
  <div className={`grid grid-cols-[minmax(9rem,12rem)_minmax(8rem,14rem)_1fr] items-center gap-x-3 gap-y-1 text-size-sm ${bold ? 'font-semibold' : ''}`}>
    <span className="truncate">{what}</span>
    <span className="truncate text-gray-600">{when}</span>
    <span className="flex flex-wrap items-center gap-1">{children}</span>
  </div>
);

const HistoryRow: React.FC<{ r: Registration }> = ({ r }) => (
  <Row what={r.course} when={shortRound(r.roundName)} bold={r.isCurrent}>
    {r.facilitated && <Badge className="bg-purple-100 text-purple-900">Facilitator</Badge>}
    <OpinionBadge opinion={r.opinion} />
    <CompletionBadge r={r} />
    {r.isCurrent && <span className="text-size-xs font-normal text-gray-500">← this one</span>}
  </Row>
);

const GrantRow: React.FC<{ g: GrantApplication }> = ({ g }) => (
  <div className="flex flex-col gap-1">
    <Row what="Career transition grant" when={formatDate(g.decisionDate ?? g.createdAt)}>
      {g.status && <Badge className={/reject/i.test(g.status) ? 'bg-red-100 text-red-900' : 'bg-yellow-100 text-yellow-900'}>{g.status}</Badge>}
      {g.amountUsd !== undefined && <span className="text-gray-600">${g.amountUsd.toLocaleString()}</span>}
    </Row>
    {g.reasoning && <div className="pl-2"><Answer label="Why" text={g.reasoning} accent="blue" /></div>}
  </div>
);

const CallRow: React.FC<{ c: EvaluationCall }> = ({ c }) => (
  <Row what="Evaluation call" when={formatDate(c.callDate ?? c.createdAt)}>
    {c.status && <Badge className="bg-yellow-100 text-yellow-900">{c.status}</Badge>}
    <OpinionBadge opinion={c.opinion} />
    {c.notesUrl && <A href={c.notesUrl} target="_blank" rel="noreferrer" className="text-size-xs">notes ↗</A>}
  </Row>
);

const Meta: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="font-normal text-gray-700">{children}</span>;

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

      <Section title="With BlueDot" accent="blue" open meta={<Meta>({withBlueDotCount})</Meta>} empty={withBlueDotCount === 0} emptyText="no registrations found for this email">
        {person.history.map((r) => <HistoryRow key={r.id} r={r} />)}
        {person.grants.map((g) => <GrantRow key={g.id} g={g} />)}
        {person.calls.map((c) => <CallRow key={c.id} c={c} />)}
      </Section>

      <Section
        title="Application"
        accent="amber"
        empty={!app}
        emptyText="not linked to this registration"
        meta={(
          <>
            <Meta>{roundLine}</Meta>
            {applicationUrl && <A href={applicationUrl} target="_blank" rel="noreferrer" className="text-size-xs">open in Airtable ↗</A>}
          </>
        )}
      >
        {app && (
          <>
            {appHeader && <p className="text-size-sm text-gray-600">{appHeader}</p>}
            <Answer accent="amber" label="End of course, wild success — how is life different?" text={app.pathToImpact} />
            <Answer accent="amber" label="Engagement with the field so far" text={app.experience} />
            <Answer accent="amber" label="Skills they'll contribute" text={app.skills} />
            <Answer accent="amber" label="Achievement they're most proud of" text={app.impressiveProject} />
            <Answer accent="amber" label="Hardest tradeoff they see" text={app.reasoning} />
            <Answer accent="amber" label="Heard about the course from" text={app.source} />
            <Answer accent="amber" label="Speed-review summary (AI)" text={app.aiSummary} />
          </>
        )}
      </Section>

      <Section
        title="Project"
        accent="teal"
        empty={person.projects.length === 0}
        emptyText="no submission"
        meta={person.projects[0]?.url && <A href={person.projects[0].url} target="_blank" rel="noreferrer" className="font-normal">{person.projects[0].title ?? 'open'} ↗</A>}
      >
        {person.projects.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            {!p.url && p.title && <p className="text-size-sm font-medium">{p.title}</p>}
            {p.evalNotes.length === 0 && <p className="text-size-sm text-gray-500">No evaluator notes.</p>}
            {p.evalNotes.map((n, i) => <Answer key={n} accent="teal" label={`Evaluator notes${p.evalNotes.length > 1 ? ` ${i + 1}` : ''}`} text={n} />)}
          </div>
        ))}
      </Section>

      {person.reports.length > 0 && (
        <Section
          title="Facilitator 1:1 report"
          accent="purple"
          meta={<Meta>{person.reports.map((r) => formatDate(r.date)).join(', ')}</Meta>}
        >
          {person.reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-size-xs text-gray-600">
                {r.round && <span>{r.round}</span>}
                {r.nextSteps.map((s) => <Badge key={s}>{s}</Badge>)}
                {r.docUrl && <A href={r.docUrl} target="_blank" rel="noreferrer">full report ↗</A>}
              </div>
              <Answer accent="purple" label="Quick take" text={r.quickTake} />
              <Answer accent="purple" label="Anything else" text={r.anythingElse} />
            </div>
          ))}
        </Section>
      )}

      <Section
        title="Facilitator feedback"
        accent="purple"
        empty={person.facilitatorFeedback.length === 0}
        emptyText="the facilitator left none"
        meta={person.facilitatorFeedback.map((fb) => (
          <span key={fb.id} className="flex items-center gap-2 font-normal">
            {fb.rating !== undefined && <span className="font-semibold text-gray-900">{fb.rating}/10</span>}
            {fb.oneOnOneRating && <Badge className="bg-purple-100 text-purple-900">{fb.oneOnOneRating}</Badge>}
            {fb.reviewer && <span className="text-gray-700">{fb.reviewer}</span>}
          </span>
        ))}
      >
        {person.facilitatorFeedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1 text-size-xs text-gray-600">
              {fb.recommendToFacilitate && <Badge className="bg-purple-100 text-purple-900">Recommended to facilitate</Badge>}
              {fb.nextSteps.map((s) => <Badge key={s}>{s.replace(/^\[!\] /, '')}</Badge>)}
              {fb.motivation && <span className="ml-1">x-risk motivated: {fb.motivation}</span>}
              {fb.round && <span className="ml-1">· {fb.round}</span>}
            </div>
            <Answer accent="purple" label="Private feedback" text={fb.feedback} />
          </div>
        ))}
      </Section>

      <Section
        title="Course feedback"
        accent="green"
        empty={person.feedback.length === 0}
        emptyText="none"
        meta={person.feedback.map((fb) => (
          <Meta key={fb.id}>
            {fb.rating !== undefined && <span className="font-semibold text-gray-900">Rating {fb.rating}</span>}
            {fb.timeSpent !== undefined && <span> · {fb.timeSpent} h/week</span>}
            {fb.futureFacilitate && <span> · would facilitate: {fb.futureFacilitate}</span>}
          </Meta>
        ))}
      >
        {person.feedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-2">
            <Answer accent="green" label="What they got out of it" text={fb.courseValue} />
            <Answer accent="green" label="What changed their mind" text={fb.changeMind} />
            <Answer accent="green" label="What they'd improve" text={fb.improvements} />
          </div>
        ))}
      </Section>
    </div>
  );
};
