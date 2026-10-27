import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Callout, Button, Field, Modal, ProgressDots, Textarea,
} from '@bluedot/ui';
import { FaArrowsRotate, FaMagnifyingGlass } from 'react-icons/fa6';
import { authFetch } from '../../lib/client/api';
import { useNavigationState } from '../../lib/client/navigation';
import { isLocalPreview } from '../../lib/preview';
import { ReviewEvidence } from './ReviewEvidence';
import { RoundPicker } from './RoundPicker';
import { PersonSearch } from './PersonSearch';
import { openNextSection } from './sectionNav';
import {
  mustLookFor, roundKey, roundLabel, roundsFor, endorsements, endorsers,
} from './reviewQueue';
import { panel } from './reviewStyles';
import type {
  Course, Decision, InvitedThisWeek, Person, QueueItem,
} from './types';

type Loaded = { person: Person } | { error: string };
type Confirmation = { decision: Decision; person: Person; item: QueueItem };
type Done = Confirmation;

const request = async <T,>(path: string, body?: unknown): Promise<T> => {
  const response = await authFetch(`/api/scout/${path}`, body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}). Please try again.`);
  return data as T;
};

const message = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong. Please try again.');

// Exported for tests
export const greeting = (name?: string, now = new Date()) => {
  const hour = now.getHours();
  let word = 'Good evening';
  if (hour < 12) word = 'Good morning';
  else if (hour < 18) word = 'Good afternoon';
  return name ? `${word}, ${name}!` : `${word}!`;
};

// A lead's weekly goal: invites sent this week across their courses, however they were sent.
// Exported for tests.
export const WEEKLY_INVITE_GOAL = 20;
export const goalLine = (invited: number) => {
  if (invited >= WEEKLY_INVITE_GOAL) return `You invited ${invited} people this week, woohoo!`;
  const left = WEEKLY_INVITE_GOAL - invited;
  return `${left} more ${left === 1 ? 'invite' : 'invites'} to hit this week’s goal!`;
};

const GoalDots = ({ invited, small = false }: { invited: number; small?: boolean }) => {
  const met = invited >= WEEKLY_INVITE_GOAL;
  const dot = (filled: boolean) => {
    if (met) return 'bg-success-fg';
    return filled ? 'bg-accent' : 'bg-subtle';
  };

  return (
    <span role="img" aria-label={`${invited} of ${WEEKLY_INVITE_GOAL} invites this week`} className="flex flex-wrap items-center gap-1">
      {Array.from({ length: WEEKLY_INVITE_GOAL }, (_, i) => <span key={i} className={`${small ? 'size-2' : 'size-2.5'} rounded-full ${dot(i < invited)}`} />)}
      {invited > WEEKLY_INVITE_GOAL && <span className="ml-1 text-size-xs font-semibold text-success-fg">+{invited - WEEKLY_INVITE_GOAL}</span>}
    </span>
  );
};

// What the lead did in the queue they just left, shown once on the main page
type SessionNote = { course: Course; invited: string[]; declined: number; skipped: number };

// Scout reads live Airtable data and has no sample data set, so the portal's local
// preview mode (synthetic token, no Airtable token) cannot show it
const PreviewNotice = () => (
  <div className="min-h-dvh bg-canvas p-3 sm:p-6">
    <Head><title>Course talent scouting · BlueDot Apps</title></Head>
    <div className={`${panel} mx-auto max-w-3xl space-y-2 p-6 text-size-sm`}>
      <h1 className="text-size-lg font-semibold">Course talent scouting</h1>
      <p className="text-secondary">This app has no local preview data. Run the portal with a real sign-in and an Airtable token to use it.</p>
    </div>
  </div>
);

const Scout = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [leadCourses, setLeadCourses] = useState<Course[]>([]);
  const [leadName, setLeadName] = useState<string>();
  // Set after mount: the page is prerendered, and the hour there is not the lead's hour
  const [greetingText, setGreetingText] = useState('');
  useEffect(() => {
    setGreetingText(greeting(leadName));
  }, [leadName]);
  const [invited, setInvited] = useState<InvitedThisWeek>({});
  const invitedRef = useRef<InvitedThisWeek>({});
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string>();
  const [round, setRound] = useState<QueueItem>();
  // The shortlist reviews a course's must-look people across rounds; `round` then only names the course
  const [mustLook, setMustLook] = useState(false);
  // Looking one person up from the search box or a ?person= link: just their card and a
  // decision, no round, no queue, then back to the start.
  const [lookup, setLookup] = useState<QueueItem>();
  const [search, setSearch] = useState('');
  const router = useRouter();
  // Skip = "not now": the person moves to the end of this pass. Forgotten when the round
  // is reopened or the queue reloads; nothing is written anywhere.
  const [skipOrder, setSkipOrder] = useState<string[]>([]);
  const [people, setPeople] = useState<Record<string, Loaded>>({});
  const requested = useRef(new Set<string>());
  const generation = useRef(0);
  const [done, setDone] = useState<Record<string, Done>>({});
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [note, setNote] = useState('');
  const [writing, setWriting] = useState(false);
  const writingRef = useRef(false);
  const [saveError, setSaveError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [searchOpen, setSearchOpen] = useState(false);
  // Invites sent since the queue was loaded; the next load counts them in invitedThisWeek
  const [freshInvites, setFreshInvites] = useState<Course[]>([]);
  const [goalPopup, setGoalPopup] = useState(false);
  const [sessionNote, setSessionNote] = useState<SessionNote>();
  // Decisions already made when the current queue was opened, so its note only covers this visit
  const doneAtOpen = useRef(new Set<string>());
  // ?viewAs=email shows the page as that lead sees it: their courses and their goal
  const viewAs = typeof router.query.viewAs === 'string' ? router.query.viewAs : undefined;
  const promptOpen = useNavigationState((state) => state.promptOpen);
  const setSessionActive = useNavigationState((state) => state.setSessionActive);

  const loadQueue = useCallback(async () => {
    if (writingRef.current) return;
    generation.current += 1;
    const queueGeneration = generation.current;
    setLoading(true);
    setQueueError(undefined);
    setSaveError(undefined);
    setConflict(false);
    try {
      const data = await request<{ items: QueueItem[]; invitedThisWeek?: InvitedThisWeek; leadCourses?: Course[]; leadName?: string }>(viewAs ? `queue?viewAs=${encodeURIComponent(viewAs)}` : 'queue');
      if (queueGeneration !== generation.current) return;
      setItems(data.items);
      const counts = data.invitedThisWeek ?? {};
      const previous = invitedRef.current;
      // An invite reaches these counts once Airtable stamps its date, a few seconds after it is sent;
      // until a count rises it stays counted here. A falling count means a new week.
      setFreshInvites((pending) => {
        const kept: Course[] = [];
        const absorbed = new Map<Course, number>();
        pending.forEach((course) => {
          const rise = (counts[course]?.total ?? 0) - (previous[course]?.total ?? 0);
          if (rise < 0) return;
          const used = absorbed.get(course) ?? 0;
          if (used < rise) absorbed.set(course, used + 1);
          else kept.push(course);
        });
        return kept;
      });
      invitedRef.current = counts;
      setInvited(counts);
      setLeadCourses(data.leadCourses ?? []);
      setLeadName(data.leadName);
      setSkipOrder([]);
      setPeople({});
      requested.current.clear();
    } catch (error) {
      if (queueGeneration === generation.current) setQueueError(message(error));
    } finally {
      if (queueGeneration === generation.current) setLoading(false);
    }
  }, [viewAs]);
  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const remaining = useMemo(() => items.filter((item) => !done[item.id]), [items, done]);
  const inScope = (item: QueueItem) => {
    if (!round) return false;
    return mustLook ? item.course === round.course && item.mustLook : !item.mustLook && roundKey(item) === roundKey(round);
  };

  let scopeItems: QueueItem[] = [];
  if (round) scopeItems = mustLook ? mustLookFor(remaining, round.course) : remaining.filter(inScope);
  const skippedItems = skipOrder.map((id) => scopeItems.find((item) => item.id === id)).filter((item): item is QueueItem => item !== undefined);
  const queue = [...scopeItems.filter((item) => !skipOrder.includes(item.id)), ...skippedItems];
  const current = lookup ?? queue[0];
  const upcoming = lookup ? undefined : queue[1];
  const loaded = current ? people[current.id] : undefined;
  const person = loaded && 'person' in loaded ? loaded.person : undefined;
  const decisions = Object.values(done).filter((entry) => inScope(entry.item));
  const total = scopeItems.length + decisions.length;
  let scopeLabel = '';
  if (round) scopeLabel = mustLook ? 'Shortlist' : roundLabel(round);

  // Next backlog round of the same course that still has people; other courses, and the backlog
  // after must look, are a deliberate choice on the main page
  const nextRound = round && !mustLook ? roundsFor(remaining.filter((item) => !item.mustLook), round.course).find((item) => roundKey(item) !== roundKey(round)) : undefined;
  // Everyone left in the queue has been skipped once: say so instead of silently showing the first skip again
  const allSkipped = scopeItems.length > 0 && scopeItems.every((item) => skipOrder.includes(item.id));
  const linkedInUrl = allSkipped ? undefined : [person?.profileUrl, person?.application?.profileUrl, person?.application?.otherProfileUrl].find((u) => u !== undefined && isLinkedIn(u));
  const cardOpen = lookup !== undefined || (round !== undefined && !allSkipped && current !== undefined);
  const weeklyInvites = leadCourses.reduce((sum, course) => sum + (invited[course]?.total ?? 0), 0) + freshInvites.filter((course) => leadCourses.includes(course)).length;
  const isLead = leadCourses.length > 0;

  // Leaving a queue part-way notes what was done there; a finished queue already showed its summary
  const leaveRound = useCallback(() => {
    const thisVisit = decisions.filter((entry) => !doneAtOpen.current.has(entry.person.id));
    if (round && current && (thisVisit.length > 0 || skippedItems.length > 0)) {
      setSessionNote({
        course: round.course,
        invited: thisVisit.filter((entry) => entry.decision === 'invite').map((entry) => entry.person.name),
        declined: thisVisit.filter((entry) => entry.decision === 'decline').length,
        skipped: skippedItems.length,
      });
    }

    setRound(undefined);
    setMustLook(false);
    setSkipOrder([]);
    setNotice(undefined);
    setGoalPopup(false);
  }, [round, current, decisions, skippedItems]);

  useEffect(() => {
    if (!sessionNote) return undefined;
    const timer = setTimeout(() => setSessionNote(undefined), 30_000);
    return () => clearTimeout(timer);
  }, [sessionNote]);

  const chooseRound = (item: QueueItem, asMustLook = false) => {
    if (writingRef.current || confirmation !== undefined || promptOpen) return;
    doneAtOpen.current = new Set(Object.keys(done));
    setRound(item);
    setMustLook(asMustLook);
    setSkipOrder([]);
    setSaveError(undefined);
    setConflict(false);
    setNotice(undefined);
    setSessionNote(undefined);
  };

  const chooseMustLook = (course: Course) => {
    const anchor = mustLookFor(remaining, course)[0];
    if (anchor) chooseRound(anchor, true);
  };

  // The URL carries the person being looked up, so a card can be shared as a link
  const setPersonInUrl = useCallback((id?: string) => {
    const query = { ...router.query };
    if (id) query.person = id;
    else delete query.person;
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router]);
  const openLookup = (item: QueueItem) => {
    if (writingRef.current || confirmation !== undefined || promptOpen) return;
    setLookup(item);
    setSaveError(undefined);
    setConflict(false);
    setNotice(undefined);
    setPersonInUrl(item.id);
  };

  const closeLookup = useCallback(() => {
    setLookup(undefined);
    setSearch('');
    setSearchOpen(true);
    setPersonInUrl(undefined);
  }, [setPersonInUrl]);

  // ?person=rec… opens that registration, if it is in the queue: on load, and whenever the
  // parameter changes underneath an open card (a pasted link, browser back). Removing it
  // closes the card. The page's own open/close write the same value, so they are no-ops here.
  const linked = typeof router.query.person === 'string' ? router.query.person : undefined;
  useEffect(() => {
    if (loading || queueError !== undefined) return;
    if (!linked) {
      if (lookup) setLookup(undefined);
      return;
    }

    if (lookup?.id === linked) return;
    const item = items.find((entry) => entry.id === linked);
    if (item && !done[item.id]) {
      setLookup(item);
    } else {
      setLookup(undefined);
      setNotice('That person is not in the queue right now.');
      setPersonInUrl(undefined);
    }
    // Runs when the URL parameter changes, not on every render that touches lookup or items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, queueError, linked]);

  const loadPerson = useCallback((id: string) => {
    if (requested.current.has(id)) return;
    requested.current.add(id);
    const requestedGeneration = generation.current;
    setPeople((state) => {
      const next = { ...state };
      delete next[id];
      return next;
    });
    void request<{ person: Person }>(`person/${id}`)
      .then((data) => {
        if (requestedGeneration === generation.current) setPeople((state) => ({ ...state, [id]: { person: data.person } }));
      })
      .catch((error: unknown) => {
        if (requestedGeneration !== generation.current) return;
        requested.current.delete(id);
        setPeople((state) => ({ ...state, [id]: { error: message(error) } }));
      });
  }, []);
  useEffect(() => {
    if (loading || queueError) return;
    if (current) loadPerson(current.id);
    if (upcoming) loadPerson(upcoming.id);
  }, [current, upcoming, loading, queueError, loadPerson]);

  // A new person starts at the top of their card, however far down the previous one was read
  const currentId = current?.id;
  useEffect(() => {
    if (currentId) window.scrollTo({ top: 0 });
  }, [currentId]);

  useEffect(() => {
    setSessionActive(!loading && !queueError && (scopeItems.length > 0 || lookup !== undefined || confirmation !== undefined));
    return () => setSessionActive(false);
  }, [loading, queueError, scopeItems.length, lookup, confirmation, setSessionActive]);

  const skip = useCallback(() => {
    if (!current || lookup !== undefined || allSkipped || writingRef.current || confirmation !== undefined || promptOpen || conflict) return;
    setSkipOrder((state) => [...state.filter((id) => id !== current.id), current.id]);
    setNotice(undefined);
    setSaveError(undefined);
  }, [current, lookup, allSkipped, confirmation, promptOpen, conflict]);

  const ask = useCallback((decision: Decision) => {
    if (!current || person?.id !== current.id || allSkipped || writingRef.current || confirmation !== undefined || promptOpen || conflict) return;
    setSaveError(undefined);
    setNote('');
    setConfirmation({ person, decision, item: current });
  }, [person, current, allSkipped, confirmation, promptOpen, conflict]);

  const confirm = useCallback(async () => {
    if (!confirmation || writingRef.current) return;
    // Capture the person before awaiting; a keystroke or double-click must never
    // change who this request applies to or submit it twice.
    const selected = confirmation;
    writingRef.current = true;
    setWriting(true);
    setSaveError(undefined);
    try {
      const forFacilitator = endorsers(selected.person).length > 0 ? note.trim() : '';
      const result = await request<{ ok: boolean; reason?: string }>('decision', { id: selected.person.id, decision: selected.decision, ...(forFacilitator ? { note: forFacilitator } : {}) });
      if (!result.ok) {
        setConflict(true);
        setSaveError(result.reason ?? 'This participant is no longer available. Refresh the queue to continue.');
        setConfirmation(undefined);
        return;
      }

      setDone((state) => ({ ...state, [selected.person.id]: selected }));
      if (selected.decision === 'invite' && leadCourses.includes(selected.item.course)) {
        setFreshInvites((state) => [...state, selected.item.course]);
        if (weeklyInvites + 1 === WEEKLY_INVITE_GOAL) setGoalPopup(true);
      }

      setSkipOrder((state) => state.filter((id) => id !== selected.person.id));
      setConfirmation(undefined);
      const who = selected.person.name ? `${selected.person.name}: ` : '';
      setNotice(selected.decision === 'invite' ? `${who}invitation requested. Airtable will send the email.` : `${who}saved as don’t invite.`);
      // A looked-up person is decided and done: back to the start
      if (lookup?.id === selected.person.id) closeLookup();
    } catch (error) {
      setSaveError(message(error));
    } finally {
      writingRef.current = false;
      setWriting(false);
    }
  }, [confirmation, note, lookup, closeLookup, leadCourses, weeklyInvites]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target instanceof HTMLElement ? event.target : undefined;
      if (target?.isContentEditable === true || target?.closest('input, textarea, select')) return;
      // The goal popup takes every key, so an Enter meant for it can never invite the next person
      if (goalPopup) return;
      // Enter confirms the open dialog; Esc is handled by the dialog itself
      if (confirmation !== undefined) {
        if (event.key === 'Enter' && !writingRef.current) {
          event.preventDefault();
          void confirm();
        }

        return;
      }

      // Esc still works with a button focused, e.g. right after clicking Skip; the other keys yield to the control
      if (event.key !== 'Escape' && target?.closest('button, a, summary')) return;
      if (writingRef.current || promptOpen || loading || queueError !== undefined) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => ask('invite'),
        ArrowLeft: () => ask('decline'),
        ArrowDown: skip,
        ...(cardOpen ? { ' ': openNextSection } : {}),
        l: () => {
          if (linkedInUrl) window.open(linkedInUrl, '_blank', 'noopener');
        },
        Escape: () => {
          if (lookup) closeLookup();
          else if (round) leaveRound();
        },
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask, skip, confirm, confirmation, goalPopup, promptOpen, loading, queueError, linkedInUrl, cardOpen, lookup, round, closeLookup, leaveRound]);

  const controlsDisabled = writing || confirmation !== undefined || goalPopup || promptOpen;
  let confirmDescription = 'This removes the participant from the queue and they won’t be considered again.';
  if (confirmation?.decision === 'invite') confirmDescription = 'This emails the participant on behalf of the course lead. You cannot undo this email.';
  let confirmLabel = confirmation?.decision === 'invite' ? 'Send invite' : 'Don’t invite';
  if (saveError) confirmLabel = 'Retry save';
  if (writing) confirmLabel = confirmation?.decision === 'invite' ? 'Sending invite…' : 'Saving…';

  if (isLocalPreview()) return <PreviewNotice />;

  return (
    <div className="min-h-dvh bg-canvas p-3 sm:p-6">
      <Head><title>Course talent scouting · BlueDot Apps</title></Head>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {/* While reviewing, the page belongs to the person: the title and the queue notes stay on the picker */}
        {!round && !lookup && (
          <>
            <header className="flex items-center justify-between gap-3">
              <h1 className="text-size-lg font-semibold">{greetingText}</h1>
              <div className="flex gap-1">
                <button type="button" aria-label="Search participants" title="Search participants" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)} className={iconButton}><FaMagnifyingGlass aria-hidden /></button>
                <button type="button" aria-label="Refresh queue" title="Refresh queue" disabled={controlsDisabled || loading} onClick={() => {
                  void loadQueue();
                }} className={iconButton}><FaArrowsRotate aria-hidden /></button>
              </div>
            </header>
            {!loading && !queueError && isLead && (
              <section aria-label="This week's goal" className="flex flex-col gap-2 px-1">
                <p className={`text-size-sm font-medium ${weeklyInvites >= WEEKLY_INVITE_GOAL ? 'text-success-fg' : 'text-primary'}`}>{goalLine(weeklyInvites)}</p>
                <GoalDots invited={weeklyInvites} />
              </section>
            )}
          </>
        )}
        {loading && <div role="status" aria-label="Loading queue" className="py-12"><ProgressDots /></div>}
        {!loading && queueError && <Callout tone="error" role="alert">{queueError} Use Refresh queue to try again.</Callout>}
        {!loading && !queueError && lookup && (
          <>
            <section aria-label="Looking up one participant" className={`${panel} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
              <p className="text-size-xs text-secondary">Opened from search · {lookup.course} · {roundLabel(lookup)}</p>
              <Button variant="outline-black" disabled={controlsDisabled} onClick={closeLookup}>Back to search</Button>
            </section>
            {saveError && !confirmation && <Callout tone="error" role="alert">{saveError}</Callout>}
            <ReviewEvidence key={lookup.id} item={lookup} person={person} error={loaded && 'error' in loaded ? loaded.error : undefined} onRetry={() => loadPerson(lookup.id)} actions={
              <div className="sticky bottom-0 rounded-b-overlay border-t border-subtle bg-canvas p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button variant="secondary" tone="destructive" disabled={!person || controlsDisabled || conflict} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</Button>
                  <Button disabled={!person || controlsDisabled || conflict} onClick={() => ask('invite')}>Invite <span aria-hidden>→</span></Button>
                </div>
                <KeyHints back="back to search" />
              </div>
            } />
          </>
        )}
        {!loading && !queueError && !lookup && (!round ? (
          <>
            {searchOpen && <PersonSearch items={remaining} query={search} onQueryChange={setSearch} onSelect={openLookup} />}
            {notice && <Callout role="status">{notice}</Callout>}
            {sessionNote && (
              <section role="status" aria-label="Your last queue" className={`${panel} flex items-start justify-between gap-3 px-4 py-3 text-size-sm`}>
                <div>
                  <p className="font-medium">Just now in {sessionNote.course}: {sessionNote.invited.length} invited · {sessionNote.declined} not invited · {sessionNote.skipped} skipped</p>
                  {sessionNote.invited.length > 0 && <p className="mt-1 text-size-xs text-secondary">Invited: {sessionNote.invited.join(', ')}</p>}
                </div>
                <button type="button" aria-label="Close" onClick={() => setSessionNote(undefined)} className="min-h-11 shrink-0 px-2 text-secondary hover:text-primary">×</button>
              </section>
            )}
            <RoundPicker items={remaining} leadCourses={leadCourses} onSelect={chooseRound} onSelectMustLook={chooseMustLook} />
          </>
        ) : <>
          {/* Where the lead is, as one quiet line; progress and skips live in the action bar below the card */}
          <section aria-label="Review scope" className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-size-xs text-secondary"><span className="text-size-sm font-medium text-primary">{round.course}</span> · {scopeLabel}{current && !allSkipped && <span> · {decisions.length} of {total} reviewed</span>}</p>
            <Button variant="outline-black" size="small" disabled={controlsDisabled} onClick={leaveRound}>{mustLook ? 'Change queue' : 'Change round'}</Button>
          </section>
          {notice && <Callout role="status">{notice}</Callout>}
          {saveError && !confirmation && <Callout tone="error" role="alert">{saveError}</Callout>}
          {allSkipped && (
            <section className={`${panel} space-y-4 p-6`}>
              <h2 className="text-size-lg font-semibold">Everyone seen once <span className="font-normal text-secondary">· {round.course} {scopeLabel}</span></h2>
              <p className="text-size-sm text-secondary">{skippedItems.length} skipped · {decisions.length} decided</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={controlsDisabled} onClick={() => setSkipOrder([])}>Go through the skipped again</Button>
                {nextRound && <Button variant="outline-black" disabled={controlsDisabled} onClick={() => chooseRound(nextRound)}>Review next round <span aria-hidden>→</span></Button>}
                <Button variant="outline-black" disabled={controlsDisabled} onClick={leaveRound}>Back to main page</Button>
              </div>
            </section>
          )}
          {!allSkipped && (current ? <ReviewEvidence key={current.id} item={current} person={person} error={loaded && 'error' in loaded ? loaded.error : undefined} onRetry={() => loadPerson(current.id)} actions={
            <div className="sticky bottom-0 flex flex-col gap-3 rounded-b-overlay border-t border-subtle bg-canvas p-4">
              <div className="flex flex-wrap items-center gap-3 text-size-xs text-secondary">
                {isLead && <span className={`font-medium ${weeklyInvites >= WEEKLY_INVITE_GOAL ? 'text-success-fg' : 'text-primary'}`}>{Math.min(weeklyInvites, WEEKLY_INVITE_GOAL)} / {WEEKLY_INVITE_GOAL} this week</span>}
                {isLead && <GoalDots invited={weeklyInvites} small />}
                <span className="ml-auto">{skippedItems.length} skipped</span>
                <Button variant="outline-black" size="small" disabled={controlsDisabled || conflict || skipOrder.length === 0} onClick={() => {
                  setSkipOrder((state) => state.slice(0, -1));
                  setNotice(undefined);
                }}>Undo skip</Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" tone="destructive" disabled={!person || controlsDisabled || conflict} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</Button>
                <Button variant="outline-black" disabled={controlsDisabled || conflict} onClick={skip}>Skip <span aria-hidden>↓</span></Button>
                <Button disabled={!person || controlsDisabled || conflict} onClick={() => ask('invite')}>Invite <span aria-hidden>→</span></Button>
              </div>
              <KeyHints back="main page" />
            </div>
          } /> : <section className={`${panel} space-y-4 p-6`}>
            <h2 className="text-size-lg font-semibold">{mustLook ? 'Shortlist cleared' : 'Round done'} <span className="font-normal text-secondary">· {round.course}{!mustLook && ` ${scopeLabel}`}</span></h2>
            <p className="text-size-sm text-secondary">{decisions.filter((entry) => entry.decision === 'invite').length} invited · {decisions.filter((entry) => entry.decision === 'decline').length} marked don’t invite</p>
            <SessionDecisions decisions={decisions} />
            {decisions.length > 0 && <p className="max-w-prose text-size-xs leading-relaxed text-secondary">Decisions are saved in Airtable; the invite emails are sent from there.</p>}
            <div className="flex flex-wrap gap-2">
              {nextRound && <Button disabled={controlsDisabled} onClick={() => chooseRound(nextRound)}>Review next round <span aria-hidden>→</span></Button>}
              <Button variant="outline-black" disabled={controlsDisabled} onClick={leaveRound}>Back to main page</Button>
            </div>
          </section>)}
        </>)}
        <Modal isOpen={confirmation !== undefined} setIsOpen={(open) => {
          if (!open && !writingRef.current) {
            setConfirmation(undefined);
            setSaveError(undefined);
          }
        }} isDismissable={!writing} title={confirmation?.decision === 'invite' ? 'Invite to an evaluation call?' : 'Mark as don’t invite?'}>
          {confirmation && <div className="max-w-md space-y-4 break-words text-size-sm">
            <p className="font-semibold">{confirmation.person.name}</p>
            <p>{confirmDescription}</p>
            {endorsers(confirmation.person).length > 0 && (
              <div className={`space-y-2 rounded-surface border-l-[3px] py-2 pl-[13px] pr-3 ${confirmation.decision === 'invite' ? 'border-accent bg-info-bg' : 'border-error-border bg-error-bg'}`}>
                <p>
                  <span className="font-semibold">Endorsed:</span>
                  {' '}This will email {endorsers(confirmation.person).join(' and ')} to let them know.
                </p>
                <Field label="Your note to the facilitator (optional)">
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} disabled={writing} maxLength={2000} placeholder="Anything you would like to tell them?" />
                </Field>
                <details className="text-size-xs">
                  <summary className="cursor-pointer text-secondary underline underline-offset-2 hover:text-primary">Remind me what they said</summary>
                  <div className="mt-2 space-y-3">
                    {endorsements(confirmation.person).map((r) => (
                      <div key={r.id} className="space-y-1">
                        {endorsements(confirmation.person).length > 1 && <p className="font-semibold">{r.facilitator ?? 'Facilitator'}</p>}
                        {[
                          { label: 'Overall take', text: r.quickTake },
                          ...r.ratings.filter((x) => x.evidence).map((x) => ({ label: `${x.label}${x.score !== undefined ? ` ${x.score}/5` : ''}`, text: x.evidence })),
                          { label: 'Their plans', text: r.plans },
                          { label: 'Anything else', text: r.anythingElse },
                        ].filter((x) => x.text).map((x) => (
                          <p key={x.label} className="whitespace-pre-wrap"><span className="font-semibold">{x.label}:</span> {x.text}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
            {writing && (
              <div className="flex items-center gap-2 text-size-xs text-secondary" role="status">
                <ProgressDots />
                <span>Saving to Airtable.</span>
              </div>
            )}
            {saveError && <p role="alert" className="text-error-fg">{saveError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" disabled={writing} onClick={() => {
                setConfirmation(undefined);
                setSaveError(undefined);
              }}>Cancel</Button>
              <Button tone={confirmation.decision === 'invite' ? undefined : 'destructive'} loading={writing} onClick={() => {
                void confirm();
              }}>{confirmLabel}</Button>
            </div>
          </div>}
        </Modal>
        <Modal isOpen={goalPopup} setIsOpen={(open) => setGoalPopup(open)} title={`${WEEKLY_INVITE_GOAL} invites this week, woohoo! 🎉`}>
          <div className="max-w-md space-y-4 text-size-sm">
            <p>You achieved this week’s goal. You can stop here, or keep going if you like.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setGoalPopup(false)}>Keep reviewing</Button>
              <Button onClick={() => {
                setGoalPopup(false);
                if (lookup) closeLookup();
                else leaveRound();
              }}>Done for this week</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

const isLinkedIn = (u: string) => {
  try {
    const { protocol, hostname } = new URL(u);
    return (protocol === 'https:' || protocol === 'http:') && (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com'));
  } catch {
    return false;
  }
};

const iconButton = 'flex size-11 items-center justify-center rounded-surface text-secondary hover:bg-tint hover:text-primary disabled:opacity-50';

const KeyHints: React.FC<{ back: string }> = ({ back }) => (
  <p className="mt-2 text-size-xs text-secondary"><kbd>Space</kbd> next section · <kbd>L</kbd> LinkedIn · <kbd>Esc</kbd> {back}</p>
);

const SessionDecisions: React.FC<{ decisions: Done[] }> = ({ decisions }) => {
  const [copyStatus, setCopyStatus] = useState<string>();
  if (decisions.length === 0) return null;
  return (
    <div className="space-y-3 text-size-sm">
      {(['invite', 'decline'] as const).map((decision) => {
        const selected = decisions.filter((entry) => entry.decision === decision);
        if (selected.length === 0) return null;
        return (
          <div key={decision}>
            <p className="font-medium">{decision === 'invite' ? 'Invitation requested' : 'Don’t invite'}</p>
            <ul className="mt-1 space-y-1 break-words">{selected.map(({ person }) => <li key={person.id}>{person.name} <span className="text-secondary">{person.email}</span></li>)}</ul>
          </div>
        );
      })}
      <Button
        variant="link"
        onClick={() => {
          const text = decisions.map(({ decision, person }) => `${decision === 'invite' ? 'Invitation requested' : 'Don’t invite'}: ${person.name} <${person.email}>`).join('\n');
          void navigator.clipboard.writeText(text).then(() => setCopyStatus('Copied')).catch(() => setCopyStatus('Could not copy. Select the text above instead.'));
        }}
      >
        Copy decisions
      </Button>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </div>
  );
};

export default Scout;
