import { A } from '@bluedot/ui';
import { type Person, type Registration } from '../lib/client/types';

// Airtable's colours for Human opinion, so the card reads like the base does.
const OPINION_STYLE: Record<string, string> = {
  'Strong yes': 'bg-green-200 text-green-900',
  'Weak yes': 'bg-green-100 text-green-800',
  Neutral: 'bg-gray-200 text-gray-800',
  'Weak no': 'bg-orange-100 text-orange-800',
  'Strong no': 'bg-red-200 text-red-900',
};

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'bg-gray-100 text-gray-800' }) => (
  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>
);

const OpinionBadge: React.FC<{ opinion?: string }> = ({ opinion }) => (
  opinion ? <Badge className={OPINION_STYLE[opinion] ?? 'bg-gray-100 text-gray-800'}>{opinion}</Badge> : null
);

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const Text: React.FC<{ children?: string }> = ({ children }) => (
  children ? <p className="whitespace-pre-wrap text-size-sm leading-relaxed">{children}</p> : null
);

// A section that is greyed out, not hidden, when there is nothing in it — so the
// eye always finds the same things in the same places.
const Section: React.FC<{ title: string; empty: boolean; emptyText: string; open?: boolean; children: React.ReactNode }> = ({
  title, empty, emptyText, open = true, children,
}) => (
  <details className={`group rounded border border-gray-200 ${empty ? 'opacity-50' : ''}`} open={open && !empty}>
    <summary className="cursor-pointer select-none px-4 py-2 text-size-sm font-semibold">
      {title}
      {empty && <span className="ml-2 font-normal text-gray-500">{emptyText}</span>}
    </summary>
    {!empty && <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>}
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

const HistoryRow: React.FC<{ r: Registration }> = ({ r }) => (
  <div className={`flex flex-wrap items-center gap-2 text-sm ${r.isCurrent ? 'font-semibold' : ''}`}>
    <span className="min-w-[10rem]">{r.course}</span>
    <span className="text-gray-600">{r.roundName.replace(/^.*?\(/, '(')}</span>
    {r.role && r.role !== 'Participant' && <Badge>{r.role}</Badge>}
    <OpinionBadge opinion={r.opinion} />
    {r.hasCertificate && <Badge className="bg-blue-100 text-blue-900">Completed</Badge>}
    {r.isCurrent && <span className="text-size-xs text-gray-500">← this one</span>}
  </div>
);

export const PersonCard: React.FC<{ person: Person; showName: boolean }> = ({ person, showName }) => {
  const links = [person.profileUrl, ...person.projects.map((p) => p.url)].filter((u): u is string => !!u);
  const summaryLine = [person.jobTitle, person.organisation, person.country].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: who (without the name unless asked), where, and flags */}
      <div className="flex flex-col gap-2 rounded border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-size-lg font-semibold">{showName ? person.name : 'Participant'}</span>
          <OpinionBadge opinion={person.opinion} />
          {person.certificateUrl && <Badge className="bg-blue-100 text-blue-900">Completed</Badge>}
          {person.reports.length > 0 && <Badge className="bg-purple-100 text-purple-900">Facilitator 1:1 report</Badge>}
          {person.scoutingStatus && <Badge className="bg-yellow-100 text-yellow-900">Status: {person.scoutingStatus}</Badge>}
        </div>
        {summaryLine && <p className="text-size-sm text-gray-700">{summaryLine}</p>}
        <p className="text-size-sm text-gray-600">{person.course} · {person.roundName} · ended {formatDate(person.roundEnd)}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((u) => (
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

      <Section title="With BlueDot" empty={person.history.length === 0} emptyText="no registrations found">
        {person.history.map((r) => <HistoryRow key={r.id} r={r} />)}
      </Section>

      <Section title="Facilitator 1:1 report" empty={person.reports.length === 0} emptyText="none">
        {person.reports.map((r) => (
          <div key={r.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-size-xs text-gray-600">
              <span>{formatDate(r.date)}</span>
              {r.round && <span>· {r.round}</span>}
              {r.nextSteps.map((s) => <Badge key={s}>{s}</Badge>)}
              {r.docUrl && <A href={r.docUrl} target="_blank" rel="noreferrer">full report ↗</A>}
            </div>
            <Text>{r.quickTake}</Text>
            <Text>{r.anythingElse}</Text>
          </div>
        ))}
      </Section>

      <Section title="Project" empty={person.projects.length === 0} emptyText="no submission">
        {person.projects.map((p) => (
          <div key={p.id} className="flex flex-col gap-1">
            <p className="text-size-sm font-medium">{p.url ? <A href={p.url} target="_blank" rel="noreferrer">{p.title ?? p.url} ↗</A> : p.title}</p>
            {p.evalNotes.map((n) => <Text key={n}>{n}</Text>)}
          </div>
        ))}
      </Section>

      <Section title="Course feedback" empty={person.feedback.length === 0} emptyText="none">
        {person.feedback.map((fb) => (
          <div key={fb.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 text-size-xs text-gray-600">
              {fb.rating !== undefined && <span>Rating {fb.rating}</span>}
              {fb.timeSpent !== undefined && <span>· {fb.timeSpent} h/week</span>}
              {fb.futureFacilitate && <span>· would facilitate: {fb.futureFacilitate}</span>}
            </div>
            {fb.courseValue && <div><p className="text-size-xs font-semibold text-gray-500">What they got out of it</p><Text>{fb.courseValue}</Text></div>}
            {fb.changeMind && <div><p className="text-size-xs font-semibold text-gray-500">Changed their mind on</p><Text>{fb.changeMind}</Text></div>}
            {fb.improvements && <div><p className="text-size-xs font-semibold text-gray-500">Improvements</p><Text>{fb.improvements}</Text></div>}
          </div>
        ))}
      </Section>

      <Section title="Application" empty={!person.application} emptyText="not linked" open={false}>
        {person.application && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-size-xs text-gray-600">
              {person.application.careerLevel && <span>{person.application.careerLevel}</span>}
              {person.application.profession && <span>· {person.application.profession}</span>}
              {person.application.fieldOfStudy?.length ? <span>· {person.application.fieldOfStudy.join(', ')}</span> : null}
            </div>
            {person.application.aiSummary && <div><p className="text-size-xs font-semibold text-gray-500">Speed-review summary</p><Text>{person.application.aiSummary}</Text></div>}
            {([
              ['What will you do differently after this course?', person.application.pathToImpact],
              ['Something they built, shipped or made happen', person.application.impressiveProject],
              ['How they have engaged so far', person.application.experience],
              ['Hardest tradeoff they see', person.application.reasoning],
              ['Skills they bring', person.application.skills],
            ] as const).map(([label, value]) => (value ? (
              <div key={label}><p className="text-size-xs font-semibold text-gray-500">{label}</p><Text>{value}</Text></div>
            ) : null))}
          </div>
        )}
      </Section>
    </div>
  );
};
