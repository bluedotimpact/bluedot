import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Modal } from '@bluedot/ui';
import { authFetch } from '../../../lib/client/api';
import type { QueueItem } from '../types';
import { demoQueue } from './demo';
import { RoundPicker as RoundChoices } from '../RoundPicker';
import { QueueSource as SourceExplanation } from '../QueueSource';
import { EvidencePanel } from './EvidencePanel';
import {
  button, primary, field, panel, Select, Empty, DraftBadge,
} from './ui';
import {
  courses, draftLabel, emptyFilters, filterQueue, roundKey, roundLabel, roundsFor, versions, type Draft, type Filters, type Version,
} from './model';

const lanes: { id: Draft | 'new'; title: string; hint: string }[] = [
  { id: 'new', title: 'To review', hint: 'Read the evidence first' },
  { id: 'shortlist', title: 'Shortlist', hint: 'Potential evaluation calls' },
  { id: 'later', title: 'Review later', hint: 'Needs another look' },
  { id: 'pass', title: 'Don’t invite', hint: 'Not a next step right now' },
];
export const ScoutDesign = ({ version }: { version: Version }) => {
  const router = useRouter();
  const demo = router.query.demo === '1';
  return <Design key={`${version}-${demo}`} version={version} demo={demo} />;
};

const Design = ({ version, demo }: { version: Version; demo: boolean }) => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [history, setHistory] = useState<Record<string, Draft>[]>([]);
  const [selected, setSelected] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteId, setInviteId] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [direction, setDirection] = useState('top');
  const design = versions.find((item) => item.id === version)!;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const request = demo ? Promise.resolve({ items: demoQueue }) : authFetch('/api/scout/queue').then(async (response) => {
      if (!response.ok) throw new Error('Could not load the queue.');
      return response.json() as Promise<{ items: QueueItem[] }>;
    });
    void request.then((data) => {
      if (active) setItems(data.items);
    }).catch(() => {
      if (active) setError('Scout could not load the queue. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [demo, retry]);
  const filtered = filterQueue(items, filters);
  const undecided = filtered.filter((item) => !drafts[item.id]);
  if (direction === 'bottom') undecided.reverse();
  const current = version === 'session' ? undecided[0] : filtered.find((item) => item.id === selected) ?? filtered[0];
  const availableRounds = roundsFor(items, filters.course);
  const selectedRound = availableRounds.find((item) => roundKey(item) === filters.round);
  const shortlisted = items.filter((item) => drafts[item.id] === 'shortlist');
  const updateFilters = (next: Partial<Filters>) => {
    setFilters((previous) => ({ ...previous, ...next, ...('course' in next ? { round: '' } : {}) }));
    setSelected('');
  };

  const chooseRound = (item: QueueItem) => {
    setFilters({ ...emptyFilters, course: item.course, round: roundKey(item) });
    setSelected('');
    setStarted(true);
    setFinished(false);
    setPickerOpen(false);
  };

  const choose = (id: string, value?: Draft) => {
    setHistory((previous) => [...previous, drafts]);
    setDrafts((previous) => {
      const next = { ...previous };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
    setNotice(`${items.find((item) => item.id === id)?.name ?? 'Participant'}: ${draftLabel(value).toLowerCase()}. Draft only.`);
  };

  const onChoose = (id: string, value: Draft) => {
    if (version === 'session' && value === 'shortlist') setInviteId(id);
    else choose(id, value);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setDrafts(previous);
    setHistory((entries) => entries.slice(0, -1));
    setNotice('Last draft choice undone.');
    setFinished(false);
  };

  const reviewPanel = (item: QueueItem) => <EvidencePanel key={item.id} item={item} demo={demo} draft={drafts[item.id]} focused={version === 'session'} onChoose={(value) => onChoose(item.id, value)} />;
  return (
    <div className="min-h-dvh bg-canvas p-3 sm:p-6 lg:p-6">
      <Head><title>{design.name} · Scout · BlueDot</title></Head>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-3"><Link href="/scout" className="inline-flex min-h-11 items-center text-size-sm text-secondary hover:text-accent">← Original Scout</Link><p className="text-size-xs text-secondary">Design preview · {demo ? 'Example participants' : 'Live queue'} · Draft decisions only</p></div>
        <nav aria-label="Scout design versions" className="grid gap-2 sm:grid-cols-3">{versions.map((item) => <Link key={item.id} href={`/scout/designs/${item.id}${demo ? '?demo=1' : ''}`} aria-current={version === item.id ? 'page' : undefined} className={`flex min-h-14 items-center gap-3 rounded-surface border p-3 text-size-sm ${version === item.id ? 'border-accent bg-info-bg text-accent' : 'border-subtle bg-raised text-secondary hover:border-strong'}`}><span className="text-size-xs opacity-60">{item.number}</span><span className="font-semibold">{item.name}</span></Link>)}</nav>
        <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-size-xs font-semibold uppercase tracking-widest text-secondary">Scout</p><h1 className="text-size-lg font-semibold tracking-tight text-primary">{design.name}</h1><p className="mt-2 max-w-prose text-size-sm leading-relaxed text-secondary">{design.description}</p></div><Link href={`/scout/designs/${version}${demo ? '' : '?demo=1'}`} className={button}>{demo ? 'Use live queue' : 'Try example participants'}</Link></header>
        <SourceExplanation count={items.length} demo={demo} />
        {loading && <div role="status" className={`${panel} p-8 text-secondary`}>Loading the Scout queue…</div>}
        {error && <div role="alert" className={`${panel} p-6`}><p>{error}</p><button type="button" className={`${button} mt-3`} onClick={() => setRetry((value) => value + 1)}>Try again</button></div>}
        {!loading && !error && <>
          {version === 'session' && !started ? <RoundChoices items={items} direction={direction} onDirection={setDirection} onSelect={chooseRound} showDirection={version === 'session'} /> : <>
            <section aria-label="Review scope" className={`${panel} p-4`}>
              {version === 'session' ? <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{filters.course}</p><p className="mt-1 text-size-xs text-secondary">{selectedRound ? roundLabel(selectedRound) : 'All rounds'} · {direction === 'top' ? 'Top' : 'Bottom'} of Airtable queue</p></div><button type="button" className={button} onClick={() => setPickerOpen(true)}>Change round</button></div> : <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"><Select label="Course" value={filters.course} onChange={(course) => updateFilters({ course })}><option value="">All supported courses</option>{courses.map((course) => <option key={course} value={course}>{course}</option>)}</Select><Select label="Course round" value={filters.round} onChange={(round) => updateFilters({ round })}><option value="">All queued rounds</option>{availableRounds.map((item) => <option key={roundKey(item)} value={roundKey(item)}>{!filters.course ? `${item.course} · ` : ''}{roundLabel(item)}</option>)}</Select><button type="button" className={`${button} self-end`} onClick={() => setPickerOpen(true)}>Browse rounds</button></div>}
              {version === 'inbox' && <div className="mt-4 grid gap-4 lg:grid-cols-3"><label className="block min-w-0 text-size-xs font-medium text-secondary">Find a participant<input type="search" placeholder="Search by name" value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} className={`${field} mt-2`} /></label><Select label="Available evidence" value={filters.evidence} onChange={(evidence) => updateFilters({ evidence })}><option value="">Any evidence</option><option value="report">Has a facilitator report</option><option value="certificate">Has a certificate</option></Select><Select label="Order" value={filters.order} onChange={(order) => updateFilters({ order })}><option value="source">Airtable queue order</option><option value="name">Name A–Z</option><option value="newest">Newest round first</option></Select></div>}
            </section>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-size-sm text-secondary">{filtered.length} in this view · {filtered.filter((item) => drafts[item.id]).length} reviewed here · {shortlisted.length} shortlisted overall</p><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={history.length === 0} onClick={undo}>Undo last choice</button>{version === 'session' ? <button type="button" className={button} onClick={() => setFinished((value) => !value)}>{finished ? 'Continue reviewing' : 'Finish session'}</button> : <button type="button" className={primary} disabled={shortlisted.length === 0} onClick={() => setReviewOpen(true)}>Review invitations ({shortlisted.length})</button>}</div></div>
            {notice && <p role="status" className="rounded-surface bg-info-bg px-4 py-3 text-size-sm text-info-fg">{notice}</p>}
            {version === 'session' && <div className="mx-auto w-full max-w-3xl space-y-4">{!finished && current ? <><progress aria-label="Review progress" max={filtered.length || 1} value={filtered.length - undecided.length} className="h-1.5 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-tint [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent" />{reviewPanel(current)}</> : <section className={`${panel} p-6`}><h2 className="text-size-lg font-semibold">Your session, at a glance.</h2><p className="mt-2 text-size-sm text-secondary">{filtered.length - undecided.length} reviewed · {undecided.length} still to review. These are draft choices.</p><DraftList items={filtered} drafts={drafts} onRemove={(id) => choose(id)} /><div className="mt-5 flex flex-wrap gap-2"><button type="button" className={primary} disabled={shortlisted.length === 0} onClick={() => setReviewOpen(true)}>Review invitations ({shortlisted.length})</button><button type="button" className={button} disabled={!filtered.some((item) => drafts[item.id] === 'later')} onClick={() => {
              setHistory((previous) => [...previous, drafts]);
              setDrafts((previous) => Object.fromEntries(Object.entries(previous).filter(([id, value]) => value !== 'later' || !filtered.some((item) => item.id === id))));
              setFinished(false);
            }}>Return to skipped people</button></div></section>}</div>}
            {version === 'inbox' && (filtered.length > 0 ? <div className="grid items-start gap-4 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]"><section aria-label="Participant list" className={`${panel} overflow-hidden`}><div className="flex items-center justify-between border-b border-subtle p-4"><h2 className="font-semibold">Participants</h2><span className="text-size-xs text-secondary">{filtered.length}</span></div><div className="max-h-[36rem] overflow-y-auto">{filtered.map((item) => <button key={item.id} type="button" aria-pressed={current?.id === item.id} onClick={() => setSelected(item.id)} className={`block min-h-24 w-full border-b border-subtle p-4 text-left last:border-0 ${current?.id === item.id ? 'bg-info-bg' : 'hover:bg-tint'}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{item.name ?? 'Participant'}</span><DraftBadge draft={drafts[item.id]} /></div><p className="mt-1 text-size-xs text-secondary">{item.course} · {roundLabel(item)}</p><p className="mt-2 text-size-xs text-secondary">{item.hasReport ? 'Facilitator report available' : 'No facilitator report'}</p></button>)}</div></section>{current && reviewPanel(current)}</div> : <Empty title="No participants match these filters." text="Try another round or clear the evidence and name filters. This is the Scout queue, not the full course roster." />)}
            {version === 'board' && <section aria-label="Scouting board" className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">{lanes.map((lane) => {
              const members = filtered.filter((item) => (drafts[item.id] ?? 'new') === lane.id);
              return <section key={lane.id} aria-label={lane.title} className="min-w-0 rounded-overlay border border-subtle bg-tint p-3"><div className="flex items-center justify-between gap-2"><h2 className="text-size-sm font-semibold">{lane.title}</h2><span className="text-size-xs text-secondary">{members.length}</span></div><p className="mt-1 text-size-xs text-secondary">{lane.hint}</p><div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto">{members.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item.id)} className="block min-h-28 w-full rounded-surface border border-subtle bg-raised p-4 text-left hover:border-accent"><p className="break-words font-semibold">{item.name ?? 'Participant'}</p><p className="mt-1 text-size-xs leading-relaxed text-secondary">{item.course}<br />{roundLabel(item)}</p><p className="mt-3 text-size-xs text-secondary">{item.hasReport ? 'Facilitator report' : 'No facilitator report'}</p><span className="mt-3 block text-size-xs font-medium text-accent">Read evidence →</span></button>)}{members.length === 0 && <p className="rounded-surface border border-dashed border-subtle p-5 text-size-xs leading-relaxed text-secondary">{lane.id === 'new' ? 'Everyone in this selection has a draft next step.' : 'No people here yet.'}</p>}</div></section>;
            })}</section>}
          </>}
        </>}
        <footer className="border-t border-subtle pt-4 text-size-xs leading-relaxed text-secondary">{design.tradeoff} Draft choices reset when you leave this page.</footer>
      </div>
      <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={pickerOpen} setIsOpen={setPickerOpen} title="Choose a round"><RoundChoices items={items} direction={direction} onDirection={setDirection} onSelect={chooseRound} showDirection={version === 'session'} /></Modal>
      <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={!!inviteId} setIsOpen={(open) => {
        if (!open) setInviteId('');
      }} title="Invite to an evaluation call?">
        <div className="max-w-md space-y-4 text-size-sm leading-relaxed"><p className="font-semibold">{items.find((item) => item.id === inviteId)?.name}</p><p>In the working app, confirming would ask Airtable to email this person from the course lead. The email cannot be undone here.</p><p className="text-secondary">This preview saves a draft invitation only. It sends no email.</p><div className="flex flex-wrap justify-end gap-2"><button type="button" className={button} onClick={() => setInviteId('')}>Cancel</button><button type="button" className={primary} onClick={() => {
          choose(inviteId, 'shortlist');
          setInviteId('');
        }}>Save invitation draft</button></div></div>
      </Modal>
      <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={reviewOpen} setIsOpen={setReviewOpen} title="Review your invitations">
        <div className="max-w-xl space-y-4"><p className="text-size-sm leading-relaxed text-secondary">{shortlisted.length} people shortlisted for an evaluation call. Check the recipients before anything is sent.</p><DraftList items={shortlisted} drafts={drafts} onRemove={(id) => choose(id)} /><p className="rounded-surface bg-info-bg p-3 text-size-sm leading-relaxed text-info-fg">Design preview: sending invitations is disabled. Your drafts have not changed Airtable.</p><button type="button" className={button} onClick={() => setReviewOpen(false)}>Back to review</button></div>
      </Modal>
      <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={version === 'board' && !!selected} setIsOpen={(open) => {
        if (!open) setSelected('');
      }} title="Review participant">{current && <div className="w-[min(42rem,calc(100vw-6rem))]">{reviewPanel(current)}</div>}</Modal>
    </div>
  );
};

const DraftList = ({ items, drafts, onRemove }: { items: QueueItem[]; drafts: Record<string, Draft>; onRemove: (id: string) => void }) => <ul className="mt-4 divide-y divide-subtle">{items.filter((item) => drafts[item.id]).map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-size-sm font-medium">{item.name}</p><p className="mt-1 text-size-xs text-secondary">{item.course} · {roundLabel(item)}</p></div><div className="flex items-center gap-3"><DraftBadge draft={drafts[item.id]} /><button type="button" className="min-h-11 text-size-xs text-accent underline" onClick={() => onRemove(item.id)}>Undo<span className="sr-only"> choice for {item.name}</span></button></div></li>)}</ul>;
