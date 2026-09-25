import { type ReactNode, useState } from 'react';
import {
  A, CardShell, ChevronRightIcon, cn, CTALinkOrButton, P,
} from '@bluedot/ui';
import {
  type EvaluationCall, type FacilitatorFeedback, type GrantApplication, type OtherApplication, type Person, type Project, type RapidGrant, type Registration, type Session, type WebFacts, type WebLink, type WebSource,
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
  orangeBright: { bg: '#ff6f2c', fg: '#ffffff' }, redBright: { bg: '#f82b60', fg: '#ffffff' },
  pinkLight1: { bg: '#f99de2', fg: '#400832' },
  grayLight2: { bg: '#eeeeee', fg: '#333333' },
  purpleLight2: { bg: '#ede2fe', fg: '#280b4d' },
};

// Choice → Airtable colour name, copied from the field definitions in Course runner.
const OPINION_COLOUR: Record<string, string> = {
  'Strong yes': 'blueBright', 'Weak yes': 'cyanLight1', Neutral: 'grayLight2', 'Weak no': 'yellowLight1', 'Strong no': 'redBright', '[tmp] VIP': 'blueLight2', TODO: 'pinkLight1',
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

const airtableStyle = (colour?: string) => (colour && AIRTABLE[colour] ? { backgroundColor: AIRTABLE[colour].bg, color: AIRTABLE[colour].fg } : undefined);

const Badge: React.FC<{ children: ReactNode; className?: string; colour?: string }> = ({ children, className = 'bg-tint text-primary', colour }) => (
  <span className={cn('inline-flex items-center max-w-full whitespace-normal break-words rounded-sm px-2 py-0.5 text-size-xxs font-medium', !airtableStyle(colour) && className)} style={airtableStyle(colour)}>{children}</span>
);

// Rapid grants store the same options in lower case ("strong yes"), so match by lower case
const OpinionBadge: React.FC<{ opinion?: string }> = ({ opinion }) => {
  if (!opinion) return null;
  const known = Object.keys(OPINION_COLOUR).find((k) => k.toLowerCase() === opinion.toLowerCase());
  return <Badge colour={known ? OPINION_COLOUR[known] : 'grayLight2'}>{known ?? opinion.charAt(0).toUpperCase() + opinion.slice(1)}</Badge>;
};

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
  .replace(/\\n/g, '\n')
  .replace(/\*\*|__|`/g, '')
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/^\s*[-*•]\s+/gm, '')
  .replace(/-{3,}|_{3,}|={3,}/g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

// Amber with an "AI" mark means a model wrote it; everything else is what people wrote
const AiMark: React.FC = () => <span className="mr-1.5 rounded-sm bg-warning-bg px-1 py-px text-size-xxs font-semibold text-warning-fg">AI</span>;
const Caption: React.FC<{ children: ReactNode; ai?: boolean }> = ({ children, ai = false }) => (
  <span className={cn('text-size-xs font-medium', ai ? 'text-warning-fg' : 'text-accent')}>{ai && <AiMark />}{children}</span>
);

const Answer: React.FC<{ label: string; text?: string; defaultOpen?: boolean; ai?: boolean }> = ({
  label, text, defaultOpen = false, ai = false,
}) => (
  text ? (
    <Disclosure
      defaultOpen={defaultOpen}
      summary={<Caption ai={ai}>{label}</Caption>}
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
  title: string; count?: number; meta?: ReactNode; empty?: boolean; emptyText?: string; defaultOpen?: boolean; ai?: boolean; children?: ReactNode;
}> = ({
  title, count, meta, empty = false, emptyText = 'none', defaultOpen = false, ai = false, children,
}) => (
  empty ? (
    <CardShell className="flex items-center gap-2 px-4 py-2.5 text-size-sm text-disabled">
      <span className="inline-block w-[14px]" />
      <span className="font-semibold">{ai && <AiMark />}{title}</span>
      <span>{emptyText}</span>
    </CardShell>
  ) : (
    <CardShell className="p-0">
      <Disclosure
        defaultOpen={defaultOpen}
        summary={(
          <>
            <span className={cn('text-size-sm font-semibold', ai ? 'text-warning-fg' : 'text-accent')}>{ai && <AiMark />}{title}{count !== undefined && <span className="font-normal text-secondary"> ({count})</span>}</span>
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

// Quiet label between groups of sections: what is about the person, what is about this round
const GroupLabel: React.FC<{ children: ReactNode; spaced?: boolean }> = ({ children, spaced = false }) => (
  <p className={cn('px-1 text-size-xxs uppercase tracking-wide text-secondary', spaced ? 'pt-6' : 'pt-2')}>{children}</p>
);

// One line above each entry when a section can hold several (two facilitators, two reports):
// who or when it is from, and the record it came from
const EntryHeading: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 text-size-xs text-secondary">{children}</div>
);

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
  // Loose notes are the job's own remarks; they only earn space when there is nothing structured
  const structured = Object.values(f).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''));
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
      {!structured && source.other?.map((line) => <Line key={line}><span className="text-secondary">“{line}”</span></Line>)}
    </ul>
  );
};

const readLabel = (source?: WebSource) => {
  if (!source) return '';
  return source.read === 'page' ? ' · read from page' : ' · from search snippet';
};

// Google Scholar profiles open sorted by year, newest first
const openUrl = (u: string) => (/scholar\.google\.[a-z.]+\/citations\?.*user=/.test(u) && !u.includes('sortby=') ? `${u}&view_op=list_works&sortby=pubdate` : u);

// Same profile, different spellings: scheme, www, query, fragment and trailing slash are ignored
const normaliseUrl = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[?#].*$/, '').replace(/\/+$/, '');

const FoundOnline: React.FC<{ facts?: WebFacts; lookedUpOn?: string; givenUrls: string[] }> = ({ facts, lookedUpOn, givenUrls }) => {
  if (!facts) return <Section title="Found online" ai empty emptyText="not looked up yet" />;
  const given = new Set(givenUrls.map(normaliseUrl));
  // Links the participant gave us already sit in the top row; only show what was newly found.
  // LinkedIn is never listed here: the profile cannot be read, so a second LinkedIn link says nothing new.
  const newLinks = facts.links.filter((link) => link.kind !== 'linkedin' && !given.has(normaliseUrl(link.url)));
  const links = sortedFoundLinks(newLinks).slice(0, MAX_FOUND_LINKS);
  const sourceFor = (link: WebLink) => facts.sources.find((source) => source.confidence === 'high' && normaliseUrl(source.url) === normaliseUrl(link.url));
  const hasFacts = (source?: WebSource) => !!source && (Object.values(source.facts ?? {}).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '')) || (source.other?.length ?? 0) > 0);
  if (links.length === 0) {
    // Still surface an unconfirmed identity: that is the most useful thing a lookup can say when it found nothing
    const identityNote = facts.identity.confident ? '' : ' · identity unconfirmed';
    return <Section title="Found online" ai empty emptyText={`nothing found online${lookedUpOn ? ` · looked up ${formatDate(lookedUpOn)}` : ''}${identityNote}`} />;
  }

  return (
    <Section
      title="Found online"
      count={links.length}
      ai
      meta={(
        <>
          <Meta>looked up{lookedUpOn ? ` ${formatDate(lookedUpOn)}` : ''}</Meta>
          {!facts.identity.confident && <Badge className="bg-warning-bg text-warning-fg">identity unconfirmed</Badge>}
        </>
      )}
    >
      <div className="flex flex-col divide-y divide-subtle">
        {links.map((link) => {
          const source = sourceFor(link);
          const label = (
            <>
              <span className="text-size-sm font-medium text-primary">{foundLinkLabel(link)}</span>
              <span className="text-size-xs text-secondary">{LINK_KIND_LABEL[link.kind] ?? link.kind}{link.confidence === 'medium' ? ' · probably them, not confirmed' : ''}{readLabel(source)}</span>
              <A href={openUrl(link.url)} target="_blank" className="ml-auto inline-flex min-h-11 shrink-0 items-center text-size-xs">open ↗</A>
            </>
          );
          return hasFacts(source) && source ? (
            <Disclosure key={link.url} defaultOpen summary={label} summaryClassName="py-1 [&>span]:w-full" bodyClassName="pb-3 pl-[22px]">
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

type Tone = 'good' | 'warn' | 'bad' | 'quiet' | 'plain';
const TONE_CLASS: Record<Tone, string> = {
  good: 'bg-info-bg text-info-fg',
  warn: 'bg-warning-bg text-warning-fg',
  bad: 'bg-error-bg text-error-fg',
  quiet: 'bg-tint text-disabled',
  plain: 'bg-tint text-primary',
};
type Status = { tone: Tone; label: string };

// Where a course stands for a participant; facilitators have no completion state
const courseStatus = (r: Registration): Status | undefined => {
  if (r.facilitated) return undefined;
  if (r.hasCertificate) return { tone: 'good', label: 'Completed' };
  if (r.droppedOut) return { tone: 'bad', label: 'Dropped out' };
  if (r.roundEnd && new Date(r.roundEnd) < new Date()) return { tone: 'bad', label: 'Not completed' };
  return { tone: 'plain', label: 'In progress' };
};

// Airtable's own option names (grant status, call status, application decision),
// coloured by what they mean for the person. Unknown options read as "pending".
const decisionStatus = (label?: string): Status => {
  if (!label) return { tone: 'quiet', label: 'No decision yet' };
  let tone: Tone = 'warn';
  if (/withdrawn/i.test(label)) tone = 'quiet';
  else if (/reject|archiv/i.test(label)) tone = 'bad';
  else if (/accept|approve/i.test(label)) tone = 'good';
  else if (/complete/i.test(label)) tone = 'plain';
  return { tone, label: label === 'call' ? 'Call' : label };
};

const monthYear = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '');

// "Biosecurity (2026 Oct W42) - Part-time" → "Part-time"
const intensityOf = (roundName: string) => roundName.split(' - ')[1];

const money = (n?: number) => (n === undefined ? undefined : `$${n.toLocaleString()}`);

// "$2,500 asked · $2,000 granted" when they differ, otherwise the one amount
const amounts = (asked?: number, granted?: number) => {
  if (asked !== undefined && granted !== undefined && asked !== granted) return `${money(asked)} asked · ${money(granted)} granted`;
  return money(granted ?? asked);
};

// The Airtable record behind a piece of information, for when the summary is not enough
const RecordLink: React.FC<{ url?: string }> = ({ url }) => (
  url ? <A href={url} target="_blank" className="text-size-xs text-secondary no-underline" title="Open the record in Airtable">↗</A> : null
);

// The list is one grid and every row a subgrid of it, so the badge columns line up across
// rows while sizing to their content. Columns: when · kind · detail · opinion · status · link.
// Below lg the six cells fall into three columns, two lines per row, instead of overflowing.
const TimelineList: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 text-size-xs text-secondary lg:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto_auto]">{children}</div>
);

// `more` adds a chevron and opens text under the row.
const TimelineRow: React.FC<{
  when: string; kind: string; detail?: ReactNode; opinion?: string; status?: Status; url?: string; linkLabel?: string; current?: boolean; quiet?: boolean; more?: ReactNode;
}> = ({
  when, kind, detail, opinion, status, url, linkLabel, current = false, quiet = false, more,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('col-span-full grid grid-cols-subgrid items-center gap-y-1 py-1.5', current && '-mx-2 rounded-surface bg-info-bg/50 px-2 font-medium text-primary', quiet && 'text-disabled')}>
      <span className="tabular-nums">{when}</span>
      <span>{kind}</span>
      <span className="min-w-0 break-words">{detail}</span>
      <span>{opinion && <OpinionBadge opinion={opinion} />}</span>
      <span>{status && <Badge className={TONE_CLASS[status.tone]}>{status.label}</Badge>}</span>
      <span className="flex items-center justify-end gap-1">
        {more && (
          <button type="button" aria-expanded={open} aria-label={open ? 'Hide details' : 'Show details'} className="flex size-6 items-center justify-center rounded-surface text-disabled hover:bg-tint" onClick={() => setOpen((o) => !o)}>
            <ChevronRightIcon size={14} aria-hidden className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-90')} />
          </button>
        )}
        {url && (linkLabel ? <A href={url} target="_blank" className="whitespace-nowrap no-underline">{linkLabel} ↗</A> : <RecordLink url={url} />)}
      </span>
      {open && more && <div className="col-span-full pb-1 pl-[4.5rem] text-primary">{more}</div>}
    </div>
  );
};

// Free text behind a row, shown when the row is opened
// `always` shows the label with a dash when there is no text, so "nothing recorded" is visible
const More: React.FC<{ label: string; text?: string; ai?: boolean; always?: boolean }> = ({
  label, text, ai = false, always = false,
}) => {
  if (!text && !always) return null;
  return (
    <div className="flex flex-col gap-1">
      <Caption ai={ai}>{label}</Caption>
      {text ? <P className="whitespace-pre-wrap text-size-sm leading-relaxed">{plain(text)}</P> : <span className="text-size-sm text-disabled">–</span>}
    </div>
  );
};

// "-" and similar placeholders typed into a text field count as empty
const hasText = (text?: string) => !!text && /[A-Za-z0-9]/.test(text);

// First line inside a grant row: who decided, when, and the project link if there is one.
// Labels below say whether the text is the applicant's or ours.
const DecisionLine: React.FC<{ by?: string; on?: string; projectUrl?: string }> = ({ by, on, projectUrl }) => (
  (by ?? on ?? projectUrl) ? (
    <p className="text-size-xs text-secondary">
      {by && `Decision by ${by}`}{by && on && ' · '}{on && formatDate(on)}
      {projectUrl && <>{(by ?? on) && ' · '}<A href={projectUrl} target="_blank">link to project ↗</A></>}
    </p>
  ) : null
);

const CourseDetail: React.FC<{ course: string; roundName: string }> = ({ course, roundName }) => {
  const intensity = intensityOf(roundName);
  return <>{course}{intensity && ` · ${intensity}`}</>;
};

const HistoryRow: React.FC<{ r: Registration }> = ({ r }) => (
  <TimelineRow
    when={monthYear(r.roundStart)}
    kind={r.facilitated ? 'Facilitator' : 'Participant'}
    detail={<CourseDetail course={r.course} roundName={r.roundName} />}
    opinion={r.opinion}
    status={courseStatus(r)}
    url={r.recordUrl}
    current={r.isCurrent}
  />
);

// An application that never became a registration: rejections in red with the reviewer's
// opinion, withdrawn and undecided ones quietly
const OtherApplicationRow: React.FC<{ a: OtherApplication }> = ({ a }) => {
  const status = decisionStatus(a.decision);
  return (
    <TimelineRow
      when={monthYear(a.createdAt)}
      kind={a.facilitator ? 'Facilitator' : 'Participant'}
      detail={<CourseDetail course={a.course} roundName={a.roundName} />}
      opinion={a.opinion}
      status={status}
      url={a.recordUrl}
      quiet={status.tone === 'quiet'}
      more={status.tone === 'bad' && hasText(a.aiSummary) && <More ai label="Speed-review summary, at application time" text={a.aiSummary} />}
    />
  );
};

const GrantRow: React.FC<{ g: GrantApplication }> = ({ g }) => (
  <TimelineRow
    when={monthYear(g.decisionDate ?? g.createdAt)}
    kind="CTG"
    detail={amounts(g.amountUsd)}
    status={decisionStatus(g.status)}
    url={g.recordUrl}
    more={(
      <div className="flex flex-col gap-2">
        <DecisionLine by={g.decidedBy} on={g.decisionDate} />
        <More always label="BlueDot · Decision reasoning" text={hasText(g.reasoning) ? g.reasoning : undefined} />
        {hasText(g.currentSituation) && <More label="Applicant · Current situation" text={g.currentSituation} />}
      </div>
    )}
  />
);

const RapidGrantRow: React.FC<{ g: RapidGrant }> = ({ g }) => (
  <TimelineRow
    when={monthYear(g.createdAt)}
    kind="Rapid grant"
    detail={amounts(g.amountRequestedUsd, g.amountGrantedUsd)}
    opinion={g.opinion}
    status={decisionStatus(g.decision)}
    url={g.recordUrl}
    more={(hasText(g.projectTitle) || hasText(g.whyItMatters) || g.madeBy) && (
      <div className="flex flex-col gap-2">
        <DecisionLine by={g.madeBy} on={g.decidedAt} projectUrl={g.publicUrl ?? g.projectUrl} />
        {hasText(g.projectTitle) && <More label="Applicant · Project title" text={g.projectTitle} />}
        {hasText(g.whyItMatters) && <More label="Applicant · How it reduces catastrophic risk" text={g.whyItMatters} />}
      </div>
    )}
  />
);

// "C4 A3 S2 E3 SC3" — the CASES ratings given on the call, omitting unrated ones
const casesLabel = (c: EvaluationCall) => {
  const parts = [['C', c.cases?.commitment], ['A', c.cases?.agency], ['S', c.cases?.sharpness], ['E', c.cases?.expertise], ['SC', c.cases?.strategicClarity]] as const;
  return parts.filter(([, v]) => v !== undefined).map(([k, v]) => `${k}${v}`).join(' ');
};

// Call notes live in Notion today; name the destination rather than "notes"
const notesLabel = (u: string) => {
  if (u.includes('notion.')) return 'Notion';
  if (u.includes('docs.google.')) return 'Doc';
  return 'Notes';
};

const CallRow: React.FC<{ c: EvaluationCall }> = ({ c }) => (
  <TimelineRow
    when={monthYear(c.callDate ?? c.createdAt)}
    kind="Eval call"
    detail={(
      <>
        {casesLabel(c) && <span title="CASES: commitment · agency · sharpness · expertise · strategic clarity">{casesLabel(c)}</span>}
        {casesLabel(c) && c.notesUrl ? ' · ' : ''}
        {c.notesUrl && <A href={c.notesUrl} target="_blank">{notesLabel(c.notesUrl)} ↗</A>}
      </>
    )}
    opinion={c.opinion}
    status={c.status ? decisionStatus(c.status) : undefined}
    url={c.recordUrl}
    more={hasText(c.notes) && <More label="BlueDot · Evaluation notes" text={c.notes} />}
  />
);

// One row per session of the current round: group and facilitator (per session, so a cover
// week shows), unit and topic, attended or not. The doc is per group, so it is linked once,
// on the group's first row.
const Sessions: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  if (sessions.length === 0) return <Section title="Sessions" empty emptyText="no sessions found for this registration" />;
  const now = new Date();
  // Sessions that have happened: started already, or recorded as attended whatever the timing says
  const happened = sessions.filter((x) => x.attended || (x.startAt && new Date(x.startAt) < now));
  const attended = happened.filter((x) => x.attended).length;
  const status = (x: Session): Status | undefined => {
    if (x.attended) return { tone: 'good', label: 'Attended' };
    if (x.startAt && new Date(x.startAt) < now) return { tone: 'bad', label: 'Absent' };
    return undefined;
  };

  // The doc belongs to the group, so it is linked once, on its first row
  const seen = new Set<number | undefined>();

  return (
    <Section title="Sessions" count={sessions.length} meta={<Meta>{attended} of {happened.length} attended</Meta>}>
      <TimelineList>
        {sessions.map((x) => {
          const first = !seen.has(x.group);
          seen.add(x.group);
          return (
            <TimelineRow
              key={x.id}
              when={monthYear(x.startAt)}
              kind={[x.group !== undefined ? `Group ${x.group}` : undefined, x.facilitator].filter(Boolean).join(' · ')}
              detail={<>{x.unit !== undefined && `Unit ${x.unit}: `}{x.topic}</>}
              status={status(x)}
              url={first ? x.docUrl : undefined}
              linkLabel="doc"
            />
          );
        })}
      </TimelineList>
    </Section>
  );
};

// Only when an evaluator has looked at the project; most submissions have just a link
const ProjectSection: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const evaluated = projects.filter((p) => p.evaluation !== undefined || p.scores.length > 0 || p.evalNotes.length > 0 || p.privateNotes.length > 0);
  if (evaluated.length === 0) return null;
  return (
    <Section
      title="Project"
      meta={evaluated.map((p) => (
        <span key={p.id} className="flex items-center gap-2 font-normal">
          {p.evaluation && <Badge>{p.evaluation}</Badge>}
          {p.scores.map((xs, i) => <Meta key={i}>{xs.join(' · ')}</Meta>)}
        </span>
      ))}
    >
      {evaluated.map((p) => (
        <div key={p.id} className="flex min-w-0 flex-col gap-2 break-words">
          <EntryHeading>
            <span>{p.url ? <A href={p.url} target="_blank">{p.title ?? 'Project'} ↗</A> : p.title ?? 'Project'}</span>
            <RecordLink url={p.recordUrl} />
          </EntryHeading>
          {p.evalNotes.map((n, i) => <Answer key={n} defaultOpen label={`Evaluator notes${p.evalNotes.length > 1 ? ` ${i + 1}` : ''}`} text={n} />)}
          {p.privateNotes.map((n, i) => <Answer key={n} defaultOpen label={`Private evaluator notes${p.privateNotes.length > 1 ? ` ${i + 1}` : ''}`} text={n} />)}
        </div>
      ))}
    </Section>
  );
};

// "10/10 · Aline gave 10 or more to 1 of the 7 they rated this round"
const feedbackSummary = (fb: FacilitatorFeedback) => {
  const who = fb.reviewer?.split(' ')[0] ?? 'The facilitator';
  const score = fb.rating !== undefined ? <><span className="font-semibold text-primary">{fb.rating}/10</span> · </> : null;
  if (fb.roundStats && fb.rating !== undefined) return <>{score}{who} gave {fb.rating} or more to {fb.roundStats.atOrAbove} of the {fb.roundStats.rated} they rated this round.</>;
  return <>{score}{who}{fb.round ? ` · ${shortRound(fb.round)}` : ''}</>;
};

export const PersonCard: React.FC<{ person: Person; showName: boolean }> = ({ person, showName }) => {
  // LinkedIn sometimes lives only on the application record, so merge both sources
  const normalise = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const profileLinks = [...new Map([person.profileUrl, person.application?.profileUrl, person.application?.otherProfileUrl]
    .filter((u): u is string => !!u)
    .map((u) => [normalise(u), u] as const)).values()];
  const summaryLine = [person.jobTitle, person.organisation, person.country].filter(Boolean).join(' · ');
  // Everything with BlueDot as one list, newest first: registrations by round start,
  // applications, grants and calls by their own dates. Undated items go last.
  const timeline = [
    ...person.history.map((r) => ({ date: r.roundStart, node: <HistoryRow key={r.id} r={r} /> })),
    ...person.otherApplications.map((a) => ({ date: a.createdAt, node: <OtherApplicationRow key={a.id} a={a} /> })),
    ...person.grants.map((g) => ({ date: g.decisionDate ?? g.createdAt, node: <GrantRow key={g.id} g={g} /> })),
    ...person.rapidGrants.map((g) => ({ date: g.createdAt, node: <RapidGrantRow key={g.id} g={g} /> })),
    ...person.calls.map((c) => ({ date: c.callDate ?? c.createdAt, node: <CallRow key={c.id} c={c} /> })),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const withBlueDotCount = person.history.length + person.otherApplications.length + person.grants.length + person.rapidGrants.length + person.calls.length;
  const app = person.application;
  const appHeader = app ? [app.careerLevel, app.profession, app.fieldOfStudy?.join(', ')].filter(Boolean).join(' · ') : '';
  // Speed-review scores (1-5), produced by the Applications-base automation at application time
  const scores: [string, number][] = [];
  if (app?.commitmentScore !== undefined) scores.push(['Commitment', app.commitmentScore]);
  if (app?.impressivenessScore !== undefined) scores.push(['Impressiveness', app.impressivenessScore]);
  if (app?.technicalSkillScore !== undefined) scores.push(['Technical', app.technicalSkillScore]);
  const roundLine = `ended ${formatDate(person.roundEnd)}`;
  // "(2026 Aug W36) - Part-time" → "2026 Aug W36 · Part-time"
  const roundLabel = shortRound(person.roundName).replace(/[()]/g, '').replace(' - ', ' · ');

  return (
    <div className="flex min-w-0 flex-col gap-2 break-words">
      <CardShell className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-size-md font-semibold text-primary">{showName ? person.name : 'Participant'}</span>
          {/* Just the human opinion up here; completion, grants and calls are all rows in With BlueDot */}
          <OpinionBadge opinion={person.opinion} />
          {person.email && <CopyEmail email={person.email} />}
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

      <GroupLabel>About them</GroupLabel>
      <FoundOnline facts={person.webFacts} lookedUpOn={person.lookedUpOn} givenUrls={profileLinks} />

      <Section title="With BlueDot" count={withBlueDotCount} defaultOpen empty={withBlueDotCount === 0} emptyText="no registrations found for this email">
        <TimelineList>{timeline.map((item) => item.node)}</TimelineList>
      </Section>

      <GroupLabel spaced>This round · {roundLabel}</GroupLabel>
      <Section
        title="Application"
        empty={!app}
        emptyText="not linked to this registration"
        meta={(
          <>
            <Meta>{roundLine}</Meta>
            <RecordLink url={app?.recordUrl} />
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
            {app.commitmentScore !== undefined && <Answer ai defaultOpen label={`Why commitment ${app.commitmentScore}/5`} text={app.commitmentRationale} />}
            {app.impressivenessScore !== undefined && <Answer ai defaultOpen label={`Why impressiveness ${app.impressivenessScore}/5`} text={app.impressivenessRationale} />}
            {app.technicalSkillScore !== undefined && <Answer ai defaultOpen label={`Why technical ${app.technicalSkillScore}/5`} text={app.technicalSkillRationale} />}
            <Answer ai defaultOpen label="Speed-review summary, at application time" text={app.aiSummary} />
            <Answer label="Imagine you're at the end of the course, and it's been a wild success for you. How is your life different?" text={app.pathToImpact} />
            <Answer label="How have you engaged with the field so far?" text={app.experience} />
            <Answer label="What skills will you contribute?" text={app.skills} />
            <Answer label="Tell us about one achievement you're most proud of." text={app.impressiveProject} />
            <Answer label="What's the hardest tradeoff or tension you see in the field?" text={app.reasoning} />
            <Answer label="Where did you hear about this course?" text={app.source} />
          </>
        )}
      </Section>

      <Sessions sessions={person.sessions} />

      <ProjectSection projects={person.projects} />

      {person.reports.length > 0 && (
        <Section
          title="Facilitator 1:1 report"
          meta={person.reports.map((r) => (
            <span key={r.id} className="flex items-center gap-2 font-normal">
              <OpinionBadge opinion={r.overallTake} />
              <Meta>{[r.facilitator, formatDate(r.date)].filter(Boolean).join(' · ')}</Meta>
              <RecordLink url={r.recordUrl} />
            </span>
          ))}
        >
          {person.reports.map((r) => (
            <div key={r.id} className="flex min-w-0 flex-col gap-2 break-words">
              {r.ratings.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-size-xs">
                  {r.ratings.filter((x) => x.score !== undefined).map((x) => <Badge key={x.label}>{x.label} {x.score}/5</Badge>)}
                </div>
              )}
              {r.nextSteps.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-size-xs text-secondary">
                  <span className="mr-1">Facilitator flagged:</span>
                  {r.nextSteps.map((step) => <Badge key={step} colour={NEXT_STEP_COLOUR[step]}>{step}</Badge>)}
                </div>
              )}
              <Answer defaultOpen label="Overall take" text={r.quickTake} />
              {r.ratings.map((x) => <Answer key={x.label} defaultOpen label={`Why ${x.label.toLowerCase()}${x.score !== undefined ? ` ${x.score}/5` : ''}`} text={x.evidence} />)}
              <Answer defaultOpen label="Their plans" text={r.plans} />
              <Answer defaultOpen label="Anything else" text={r.anythingElse} />
              <Answer defaultOpen label="Review notes (BlueDot)" text={r.reviewNotes} />
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
            <Meta>{fb.reviewer ?? 'facilitator not recorded'}</Meta>
            <RecordLink url={fb.recordUrl} />
          </span>
        ))}
      >
        {person.facilitatorFeedback.map((fb, i) => (
          <div key={fb.id} className={cn('flex min-w-0 flex-col gap-2 break-words', i > 0 && 'border-t border-subtle pt-4')}>
            <p className="text-size-xs text-secondary">{feedbackSummary(fb)}</p>
            {(fb.recommendToFacilitate || fb.nextSteps.length > 0 || fb.motivation) && (
              <div className="flex flex-wrap items-center gap-1 text-size-xs text-secondary">
                <span className="mr-1">Facilitator flagged:</span>
                {fb.recommendToFacilitate && <Badge>Recommended to facilitate</Badge>}
                {fb.nextSteps.map((step) => <Badge key={step} colour={NEXT_STEP_COLOUR[step]}>{step.replace(/^\[!\] /, '')}</Badge>)}
                {fb.motivation && <span className="ml-1">x-risk motivated: {fb.motivation}</span>}
              </div>
            )}
            <Answer defaultOpen label="Private feedback" text={fb.feedback} />
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
            {' '}
            <RecordLink url={fb.recordUrl} />
          </Meta>
        ))}
      >
        {person.feedback.map((fb) => (
          <div key={fb.id} className="flex min-w-0 flex-col gap-2 break-words">
            <Answer defaultOpen label="What they got out of it" text={fb.courseValue} />
            <Answer defaultOpen label="What changed their mind" text={fb.changeMind} />
            <Answer defaultOpen label="What they'd improve" text={fb.improvements} />
          </div>
        ))}
      </Section>
    </div>
  );
};
