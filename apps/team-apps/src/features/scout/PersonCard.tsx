import { type ReactNode, useState } from 'react';
import {
  A, CardShell, ChevronRightIcon, cn, CTALinkOrButton, P,
} from '@bluedot/ui';
import {
  type EvaluationCall, type GrantApplication, type Person, type Registration, type WebFacts, type WebLink, type WebSource,
} from './types';

// The CRM interface page course leads already use to prepare calls ("Their CRM record")
const CRM_BASE_ID = 'apppOzz9fPg59PxLa';
const CRM_PERSON_PAGE_ID = 'pagxj8sTbwi5d5k5z';

// Airtable's select colours (its documented palette), so badges read like the base does.
const AIRTABLE: Record<string, { bg: string; fg: string }> = {
  blueLight2: { bg: '#cfdfff', fg: '#102046' }, blueLight1: { bg: '#9cc7ff', fg: '#102046' }, blueBright: { bg: '#2d7ff9', fg: '#ffffff' },
  cyanLight2: { bg: '#d0f0fd', fg: '#04283f' }, cyanLight1: { bg: '#77d1f3', fg: '#04283f' },
  tealLight2: { bg: '#c2f5e9', fg: '#012524' },
  greenLight2: { bg: '#d1f7c4', fg: '#0b1d05' },
  yellowLight2: { bg: '#ffeab6', fg: '#3b2300' }, yellowLight1: { bg: '#ffd66e', fg: '#3b2300' }, yellowBright: { bg: '#fcb400', fg: '#3b2300' },
  orangeBright: { bg: '#ff6f2c', fg: '#ffffff' },
  pinkLight1: { bg: '#f99de2', fg: '#400832' },
  grayLight2: { bg: '#eeeeee', fg: '#333333' },
  purpleLight2: { bg: '#ede2fe', fg: '#280b4d' },
};

// Choice → Airtable colour name, copied from the field definitions in Course runner.
const OPINION_COLOUR: Record<string, string> = {
  'Strong yes': 'blueBright', 'Weak yes': 'cyanLight1', Neutral: 'grayLight2', 'Weak no': 'yellowLight1', 'Strong no': 'orangeBright', '[tmp] VIP': 'blueLight2', TODO: 'pinkLight1',
};
const NEXT_STEP_COLOUR: Record<string, string> = {
  'No further action needed': 'blueLight2',
  'Add to talent pipeline [keep warm for future opportunities/check-ins]': 'cyanLight2',
  '[!] Flag for 1-1 advising with BlueDot team': 'tealLight2',
  'Schedule follow-up call with BlueDot team within ~1 week (high-priority)': 'tealLight2',
  '[!] Flag as candidate for funding (career transition/project)': 'greenLight2',
  'Flag as candidate for funding (career transition/project)': 'greenLight2',
  '[!] Recommend to facilitate': 'yellowLight2',
};
const ONE_ON_ONE_RATING_COLOUR: Record<string, string> = {
  Exceptional: 'blueLight2', Promising: 'cyanLight2', Solid: 'tealLight2', 'Not a fit': 'greenLight2',
};

const airtableStyle = (colour?: string) => (colour && AIRTABLE[colour] ? { backgroundColor: AIRTABLE[colour].bg, color: AIRTABLE[colour].fg } : undefined);

const Badge: React.FC<{ children: ReactNode; className?: string; colour?: string }> = ({ children, className = 'bg-tint text-primary', colour }) => (
  <span className={cn('inline-flex items-center max-w-full whitespace-normal break-words rounded-sm px-2 py-0.5 text-size-xxs font-medium', !airtableStyle(colour) && className)} style={airtableStyle(colour)}>{children}</span>
);

const OpinionBadge: React.FC<{ opinion?: string }> = ({ opinion }) => (
  opinion ? <Badge colour={OPINION_COLOUR[opinion]}>{opinion}</Badge> : null
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
      <summary className={cn('min-h-11 cursor-pointer select-none list-none rounded-surface marker:hidden [&::-webkit-details-marker]:hidden hover:bg-tint focus:outline-none focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-focus', summaryClassName)}>
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <ChevronRightIcon size={14} aria-hidden className={cn('shrink-0 text-disabled transition-transform motion-reduce:transition-none', open && 'rotate-90')} />
          {summary}
        </span>
        {!open && preview}
      </summary>
      {open && <div className={bodyClassName}>{children}</div>}
    </details>
  );
};

// A question with its answer. Collapsed: the label and the first line of the answer.
// Application and feedback answers arrive as free text, sometimes with markdown
// syntax typed in by hand. Strip the noise so previews read as prose.
const plain = (text: string) => text
  .replace(/\*\*|__|`/g, '')
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/^\s*[-*•]\s+/gm, '')
  .replace(/-{3,}|_{3,}|={3,}/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const Caption: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span className="text-size-xs font-medium text-accent">{children}</span>
);

const Answer: React.FC<{ label: string; text?: string; defaultOpen?: boolean }> = ({ label, text, defaultOpen = false }) => (
  text ? (
    <Disclosure
      defaultOpen={defaultOpen}
      summary={<Caption>{label}</Caption>}
      summaryClassName="flex flex-col gap-1 py-1 [&>span]:flex-nowrap [&>span]:items-start"
      preview={<span className="line-clamp-2 pl-[22px] text-size-sm leading-snug text-primary">{plain(text).replace(/\s+/g, ' ')}</span>}
      bodyClassName="pl-[22px] pt-1"
    >
      <P className="whitespace-pre-wrap text-size-sm leading-relaxed">{plain(text)}</P>
    </Disclosure>
  ) : null
);

// Section header carries the summary (count, score, rating) so most sections
// never need opening. Empty sections are greyed and cannot be opened.
const Section: React.FC<{
  title: string; count?: number; meta?: ReactNode; empty?: boolean; emptyText?: string; defaultOpen?: boolean; titleClassName?: string; children?: ReactNode;
}> = ({
  title, count, meta, empty = false, emptyText = 'none', defaultOpen = false, titleClassName = 'text-accent', children,
}) => (
  empty ? (
    <CardShell className="flex items-center gap-2 px-4 py-2.5 text-size-sm text-disabled">
      <span className="inline-block w-[14px]" />
      <span className="font-semibold">{title}</span>
      <span>{emptyText}</span>
    </CardShell>
  ) : (
    <CardShell className="p-0">
      <Disclosure
        defaultOpen={defaultOpen}
        summary={(
          <>
            <span className={cn('text-size-sm font-semibold', titleClassName)}>{title}{count !== undefined && <span className="font-normal text-secondary"> ({count})</span>}</span>
            {meta && <span className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-size-xs text-secondary">{meta}</span>}
          </>
        )}
        summaryClassName="px-4 py-2.5 [&>span]:w-full"
        bodyClassName="flex flex-col gap-3 border-t border-subtle px-4 py-3 pl-[38px]"
      >
        {children}
      </Disclosure>
    </CardShell>
  )
);

const Meta: React.FC<{ children: ReactNode }> = ({ children }) => <span>{children}</span>;

// ---- Found online: what the lookup job found. Facts only, each with its source. ----

// Display order for found links, then within a kind by confidence (high first)
const LINK_KIND_ORDER = ['linkedin', 'publications', 'github', 'website', 'forum', 'programme', 'other'];
const LINK_KIND_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn', publications: 'Publications', github: 'GitHub', website: 'Website', forum: 'Forum', programme: 'Programme', other: 'Mention',
};
const MAX_FOUND_LINKS = 5;

const PUBLICATION_HOSTS: [RegExp, string][] = [
  [/semanticscholar/, 'Semantic Scholar'], [/researchgate/, 'ResearchGate'], [/scholar\.google/, 'Google Scholar'], [/arxiv/, 'arXiv'],
];

const foundLinkLabel = (link: WebLink) => {
  if (link.kind === 'linkedin') return 'LinkedIn';
  if (link.kind === 'github') return 'GitHub';
  if (link.kind === 'publications') {
    const known = PUBLICATION_HOSTS.find(([pattern]) => pattern.test(link.url));
    if (known) return known[1];
  }

  return hostLabel(link.url);
};

const confidenceRank = (link: WebLink) => (link.confidence === 'high' ? 0 : 1);

const sortedFoundLinks = (links: WebLink[]) => [...links]
  .sort((a, b) => (confidenceRank(a) - confidenceRank(b)) || (LINK_KIND_ORDER.indexOf(a.kind) - LINK_KIND_ORDER.indexOf(b.kind)));

const Line: React.FC<{ children: ReactNode }> = ({ children }) => <li className="text-size-sm leading-relaxed text-primary">{children}</li>;

// One source's facts, laid out for its kind. Only what the page said, in the shape it said it.
const SourceFacts: React.FC<{ source: WebSource }> = ({ source }) => {
  const f = source.facts ?? {};
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-secondary">
      {f.headline && <Line><span className="font-medium">{f.headline}</span></Line>}
      {f.location && <Line><span className="text-secondary">{f.location}</span></Line>}
      {f.about && <li className="list-none -ml-5"><Answer label="About" text={f.about} /></li>}
      {f.roles?.map((r, i) => (
        <Line key={`${r.title}-${i}`}>
          <span className="font-medium">{r.title}</span>{r.company && <> · {r.company}</>}{r.since && <span className="text-secondary"> · since {r.since}</span>}
          {r.description && <span className="block text-size-xs text-secondary">{r.description}</span>}
        </Line>
      ))}
      {f.papers?.map((paper) => (
        <Line key={paper.title}>
          {paper.url ? <A href={paper.url} target="_blank">{paper.title}</A> : paper.title}
          <span className="text-size-xs text-secondary"> · {[paper.venue, paper.year, paper.first_author ? 'first author' : undefined, paper.citations !== undefined && paper.citations !== null ? `${paper.citations} citations` : undefined].filter(Boolean).join(' · ')}</span>
          {paper.abstract && <div className="pt-1"><Answer label="Abstract" text={paper.abstract} /></div>}
        </Line>
      ))}
      {f.total_citations !== undefined && f.total_citations !== null && <Line><span className="text-secondary">{f.total_citations} citations in total</span></Line>}
      {f.bio && <Line>{f.bio}</Line>}
      {[...(f.recent ?? []), ...(f.starred ?? []).filter((r) => !(f.recent ?? []).some((x) => x.name === r.name))].map((repo) => (
        <Line key={repo.name}>
          <span className="font-medium">{repo.name}</span>{repo.description && <> · {repo.description}</>}
          <span className="text-size-xs text-secondary">{repo.stars !== undefined ? ` · ★ ${repo.stars}` : ''}{repo.last_activity ? ` · last active ${repo.last_activity}` : ''}</span>
        </Line>
      ))}
      {f.languages?.length ? <Line><span className="text-size-xs text-secondary">{f.languages.join(' · ')}{f.followers !== undefined ? ` · ${f.followers} followers` : ''}</span></Line> : null}
      {f.posts?.map((post) => (
        <Line key={post.title}>
          {post.url ? <A href={post.url} target="_blank">{post.title}</A> : post.title}{post.date && <span className="text-size-xs text-secondary"> · {formatDate(post.date)}</span>}
          {post.first_paragraph && <div className="pt-1"><Answer label="Opening" text={post.first_paragraph} /></div>}
        </Line>
      ))}
      {f.mention && <Line>“{f.mention}”</Line>}
      {[f.cohort, f.project, f.mentor].some(Boolean) && <Line><span className="text-size-xs text-secondary">{[f.cohort, f.project, f.mentor && `mentor: ${f.mentor}`].filter(Boolean).join(' · ')}</span></Line>}
      {source.other?.map((line) => <Line key={line}><span className="text-secondary">“{line}”</span></Line>)}
    </ul>
  );
};

const readLabel = (source?: WebSource) => {
  if (!source) return '';
  return source.read === 'page' ? ' · read from page' : ' · from search snippet';
};

// Same profile, different spellings: scheme, www, query, fragment and trailing slash are ignored
const normaliseUrl = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[?#].*$/, '').replace(/\/+$/, '');

const FoundOnline: React.FC<{ facts?: WebFacts; lookedUpOn?: string; givenUrls: string[] }> = ({ facts, lookedUpOn, givenUrls }) => {
  if (!facts) return <Section title="Found online" empty emptyText="not looked up yet" />;
  const given = new Set(givenUrls.map(normaliseUrl));
  // Links the participant gave us already sit in the top row; only show what was newly found
  const newLinks = facts.links.filter((link) => !given.has(normaliseUrl(link.url)));
  const links = sortedFoundLinks(newLinks).slice(0, MAX_FOUND_LINKS);
  const sourceFor = (link: WebLink) => facts.sources.find((source) => source.confidence === 'high' && normaliseUrl(source.url) === normaliseUrl(link.url));
  const hasFacts = (source?: WebSource) => !!source && (Object.values(source.facts ?? {}).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '')) || (source.other?.length ?? 0) > 0);
  if (links.length === 0) {
    // Still surface an unconfirmed identity: that is the most useful thing a lookup can say when it found nothing
    const identityNote = !facts.identity.confident && facts.identity.note ? ` · identity unconfirmed: ${facts.identity.note}` : '';
    return <Section title="Found online" empty emptyText={`nothing found online${lookedUpOn ? ` · looked up ${formatDate(lookedUpOn)}` : ''}${identityNote}`} />;
  }

  return (
    <Section
      title="Found online"
      count={newLinks.length}
      titleClassName="text-warning-fg"
      meta={(
        <>
          <Meta>AI lookup{lookedUpOn ? ` · ${formatDate(lookedUpOn)}` : ''}</Meta>
          {!facts.identity.confident && <Badge className="bg-warning-bg text-warning-fg">identity unconfirmed</Badge>}
        </>
      )}
    >
      {!facts.identity.confident && facts.identity.note && <p className="text-size-xs text-secondary">{facts.identity.note}</p>}
      <div className="flex flex-col divide-y divide-subtle">
        {links.map((link) => {
          const source = sourceFor(link);
          const label = (
            <>
              <span className="text-size-sm font-medium text-primary">{foundLinkLabel(link)}</span>
              <span className="text-size-xs text-secondary">{LINK_KIND_LABEL[link.kind] ?? link.kind}{link.confidence === 'medium' ? ' · unverified' : ''}{readLabel(source)}</span>
              <A href={link.url} target="_blank" className="ml-auto inline-flex min-h-11 shrink-0 items-center text-size-xs">open ↗</A>
            </>
          );
          return hasFacts(source) && source ? (
            <Disclosure key={link.url} summary={label} summaryClassName="py-1 [&>span]:w-full" bodyClassName="pb-3 pl-[22px]">
              <SourceFacts source={source} />
            </Disclosure>
          ) : (
            <div key={link.url} className="flex items-center gap-2 py-1"><span className="inline-block w-[14px] shrink-0" />{label}</div>
          );
        })}
      </div>
    </Section>
  );
};

// The email as plain text with a copy control — it is data, not a link to open.
const CopyEmail: React.FC<{ email: string }> = ({ email }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy email"
      className="flex min-h-11 min-w-0 cursor-pointer items-center gap-1 text-size-xs text-secondary hover:text-primary"
      onClick={() => {
        void navigator.clipboard.writeText(email).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }).catch(() => setCopied(false));
      }}
    >
      <span className="select-all break-all">{email}</span>
      <span aria-hidden className="text-size-xs">{copied ? '✓' : '⧉'}</span>
    </button>
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

// Completion only means something for participants: facilitators never receive a certificate
const CompletionBadge: React.FC<{ r: Registration }> = ({ r }) => {
  if (r.facilitated) return null;
  if (r.hasCertificate) return <Badge className="bg-info-bg text-info-fg">Completed</Badge>;
  if (r.droppedOut) return <Badge className="bg-error-bg text-error-fg">Dropped out</Badge>;
  if (r.roundEnd && new Date(r.roundEnd) < new Date()) return <Badge className="bg-error-bg text-error-fg">Not completed</Badge>;
  return null;
};

// Three aligned columns: what · when · badges. Stacks on narrow screens so the page never scrolls sideways.
const Row: React.FC<{ what: ReactNode; when: ReactNode; bold?: boolean; children?: ReactNode }> = ({
  what, when, bold = false, children,
}) => (
  <div className={`grid grid-cols-1 items-center gap-x-4 gap-y-1 text-size-sm text-primary lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] ${bold ? '-mx-2 rounded-surface bg-info-bg/50 px-2 py-1 font-medium' : ''}`}>
    <span className="truncate">{what}</span>
    <span className="truncate text-size-xs text-secondary">{when}</span>
    <span className="flex flex-wrap items-center gap-1">{children}</span>
  </div>
);

const HistoryRow: React.FC<{ r: Registration }> = ({ r }) => (
  <Row what={r.course} when={shortRound(r.roundName)} bold={r.isCurrent}>
    {r.facilitated && <Badge colour="purpleLight2">Facilitator</Badge>}
    <OpinionBadge opinion={r.opinion} />
    <CompletionBadge r={r} />
  </Row>
);

const GrantRow: React.FC<{ g: GrantApplication }> = ({ g }) => (
  <div className="flex flex-col gap-1">
    <Row what={/rapid/i.test(g.status ?? '') ? 'Rapid grant' : 'Career transition grant'} when={formatDate(g.decisionDate ?? g.createdAt)}>
      {g.status && <Badge className={/reject/i.test(g.status) ? 'bg-error-bg text-error-fg' : 'bg-warning-bg text-warning-fg'}>{g.status}</Badge>}
      {g.amountUsd !== undefined && <span className="text-secondary">${g.amountUsd.toLocaleString()}</span>}
    </Row>
    <Answer label="Why" text={g.reasoning} />
  </div>
);

// "C4 A3 S2 E3 SC3" — the CASES ratings given on the call, omitting unrated ones
const casesLabel = (c: EvaluationCall) => {
  const parts = [['C', c.cases?.commitment], ['A', c.cases?.agency], ['S', c.cases?.sharpness], ['E', c.cases?.expertise], ['SC', c.cases?.strategicClarity]] as const;
  return parts.filter(([, v]) => v !== undefined).map(([k, v]) => `${k}${v}`).join(' ');
};

const CallRow: React.FC<{ c: EvaluationCall }> = ({ c }) => (
  <Row what="Evaluation call" when={formatDate(c.callDate ?? c.createdAt)}>
    {c.status && <Badge className="bg-warning-bg text-warning-fg">{c.status}</Badge>}
    <OpinionBadge opinion={c.opinion} />
    {casesLabel(c) && <span className="text-size-xs text-secondary" title="CASES: commitment · agency · sharpness · expertise · strategic clarity">{casesLabel(c)}</span>}
    {c.notesUrl && <A href={c.notesUrl} target="_blank" className="inline-flex min-h-11 min-w-11 items-center text-size-xs">notes ↗</A>}
  </Row>
);

export const PersonCard: React.FC<{ person: Person; showName: boolean }> = ({ person, showName }) => {
  // LinkedIn sometimes lives only on the application record, so merge both sources
  const normalise = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const profileLinks = [...new Map([person.profileUrl, person.application?.profileUrl, person.application?.otherProfileUrl]
    .filter((u): u is string => !!u)
    .map((u) => [normalise(u), u] as const)).values()];
  const summaryLine = [person.jobTitle, person.organisation, person.country].filter(Boolean).join(' · ');
  const withBlueDotCount = person.history.length + person.grants.length + person.calls.length;
  const app = person.application;
  const appHeader = app ? [app.careerLevel, app.profession, app.fieldOfStudy?.join(', ')].filter(Boolean).join(' · ') : '';
  // Speed-review scores (1-5), produced by the Applications-base automation at application time
  const scores: [string, number][] = [];
  if (app?.commitmentScore !== undefined) scores.push(['Commitment', app.commitmentScore]);
  if (app?.impressivenessScore !== undefined) scores.push(['Impressiveness', app.impressivenessScore]);
  if (app?.technicalSkillScore !== undefined) scores.push(['Technical', app.technicalSkillScore]);
  const roundLine = `${shortRound(person.roundName)} · ended ${formatDate(person.roundEnd)}`;

  return (
    <div className="flex min-w-0 flex-col gap-2 break-words">
      <CardShell className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-size-md font-semibold text-primary">{showName ? person.name : 'Participant'}</span>
          {person.email && <CopyEmail email={person.email} />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OpinionBadge opinion={person.opinion} />
          {person.certificateUrl && <Badge className="bg-info-bg text-info-fg">Completed</Badge>}
          {person.reports.length > 0 && <Badge colour="purpleLight2">Facilitator 1:1 report</Badge>}
          {person.calls.length > 0 && <Badge className="bg-warning-bg text-warning-fg">Had an evaluation call</Badge>}
          {person.grants.length > 0 && <Badge className="bg-warning-bg text-warning-fg">Applied for a grant</Badge>}
        </div>
        {summaryLine && <p className="text-size-sm text-secondary">{summaryLine}</p>}
        {/* Line 1: where they are online. Line 2: our own records about them. */}
        {profileLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {profileLinks.map((u) => (
              <CTALinkOrButton key={u} size="small" className="min-h-11 text-size-xs" variant="outline-black" url={u} target="_blank">{hostLabel(u)} ↗</CTALinkOrButton>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-size-xs">
          <span className="font-medium text-secondary">BlueDot records:</span>
          {person.crmPersonId
            ? <A href={`https://airtable.com/${CRM_BASE_ID}/${CRM_PERSON_PAGE_ID}/${person.crmPersonId}`} target="_blank" className="inline-flex min-h-11 items-center">CRM record ↗</A>
            : <span className="text-disabled">no CRM record found for this email</span>}
          {person.projects.filter((p) => p.url).map((p) => (
            <A key={p.id} href={p.url} target="_blank" className="inline-flex min-h-11 items-center">Project ↗</A>
          ))}
        </div>
      </CardShell>

      <FoundOnline facts={person.webFacts} lookedUpOn={person.lookedUpOn} givenUrls={profileLinks} />

      <Section title="With BlueDot" count={withBlueDotCount} defaultOpen empty={withBlueDotCount === 0} emptyText="no registrations found for this email">
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
          </>
        )}
      >
        {app && (
          <>
            {appHeader && <p className="pl-[22px] text-size-xs text-secondary">{appHeader}</p>}
            {scores.length > 0 && (
              <div className="flex flex-wrap gap-1 pl-[22px]">
                {scores.map(([label, score]) => <Badge key={label}>{label} {score}/5</Badge>)}
              </div>
            )}
            {app.commitmentScore !== undefined && <Answer defaultOpen label={`Why commitment ${app.commitmentScore}/5 (AI)`} text={app.commitmentRationale} />}
            {app.impressivenessScore !== undefined && <Answer defaultOpen label={`Why impressiveness ${app.impressivenessScore}/5 (AI)`} text={app.impressivenessRationale} />}
            {app.technicalSkillScore !== undefined && <Answer defaultOpen label={`Why technical ${app.technicalSkillScore}/5 (AI)`} text={app.technicalSkillRationale} />}
            <Answer label="Speed-review summary (AI, at application time)" text={app.aiSummary} />
            <Answer label="Imagine you're at the end of the course, and it's been a wild success for you. How is your life different?" text={app.pathToImpact} />
            <Answer label="How have you engaged with the field so far?" text={app.experience} />
            <Answer label="What skills will you contribute?" text={app.skills} />
            <Answer label="Tell us about one achievement you're most proud of." text={app.impressiveProject} />
            <Answer label="What's the hardest tradeoff or tension you see in the field?" text={app.reasoning} />
            <Answer label="Where did you hear about this course?" text={app.source} />
          </>
        )}
      </Section>

      {person.projects.some((p) => p.evalNotes.length > 0) && (
        <Section title="Project notes">
          {person.projects.map((p) => p.evalNotes.map((n, i) => (
            <Answer key={n} label={`Evaluator notes${p.evalNotes.length > 1 ? ` ${i + 1}` : ''}`} text={n} />
          )))}
        </Section>
      )}

      {person.reports.length > 0 && (
        <Section title="Facilitator 1:1 report" meta={<Meta>{person.reports.map((r) => formatDate(r.date)).join(', ')}</Meta>}>
          {person.reports.map((r) => (
            <div key={r.id} className="flex min-w-0 flex-col gap-2 break-words">
              {(r.nextSteps.length > 0 || r.docUrl) && (
                <div className="flex flex-wrap items-center gap-2 text-size-xs">
                  {r.nextSteps.map((step) => <Badge key={step} colour={NEXT_STEP_COLOUR[step]}>{step}</Badge>)}
                  {r.docUrl && <A href={r.docUrl} target="_blank" className="inline-flex min-h-11 items-center">full report ↗</A>}
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
            {fb.oneOnOneRating && <Badge colour={ONE_ON_ONE_RATING_COLOUR[fb.oneOnOneRating]}>{fb.oneOnOneRating}</Badge>}
            {fb.reviewer && <Meta>{fb.reviewer}</Meta>}
          </span>
        ))}
      >
        {person.facilitatorFeedback.map((fb) => (
          <div key={fb.id} className="flex min-w-0 flex-col gap-2 break-words">
            {(fb.recommendToFacilitate || fb.nextSteps.length > 0 || fb.motivation) && (
              <div className="flex flex-wrap items-center gap-1 text-size-xs text-secondary">
                {fb.recommendToFacilitate && <Badge>Recommended to facilitate</Badge>}
                {fb.nextSteps.map((step) => <Badge key={step} colour={NEXT_STEP_COLOUR[step]}>{step.replace(/^\[!\] /, '')}</Badge>)}
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
          <div key={fb.id} className="flex min-w-0 flex-col gap-2 break-words">
            <Answer label="What they got out of it" text={fb.courseValue} />
            <Answer label="What changed their mind" text={fb.changeMind} />
            <Answer label="What they'd improve" text={fb.improvements} />
          </div>
        ))}
      </Section>
    </div>
  );
};
