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
import { ReviewEvidence, type Move } from './ReviewEvidence';
import { RoundPicker } from './RoundPicker';
import { PersonSearch } from './PersonSearch';
import { openNextSection } from './sectionNav';
import {
  courses, isLinkedIn, mustLookFor, roundKey, roundLabel, roundsFor, endorsements, endorsers,
} from './reviewQueue';
import { panel } from './reviewStyles';
import type {
  Course, Decision, InvitedThisWeek, Person, QueueItem,
} from './types';

type Loaded = { person: Person } | { error: string };
type Entry = { decision: Decision; person: Person; item: QueueItem; note?: string; fromLookup?: boolean };
type Staged = Entry & { until: number };
// A decision whose save failed: the person comes back right after `after`, the one on screen
// then, until the lead acts on that one; after that they are next
type Retry = { id: string; decision: Decision; after?: string };
type Alert = { id: string; text: string; tone: 'warning' | 'error' };
type DecisionResult = { ok: boolean; reason?: string; already?: string; on?: string };
type QueuePart = 'shortlist' | 'backlog' | 'all';
type QueueResponse = { items: QueueItem[]; invitedThisWeek?: InvitedThisWeek; leadCourses?: Course[]; leadName?: string; later?: { courses: Course[]; part: QueuePart }[] };

// Pieces of the queue arrive separately; a person already listed is never added twice
const mergeItems = (current: QueueItem[], incoming: QueueItem[]) => {
  const known = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !known.has(item.id))];
};

const request = async <T,>(path: string, body?: unknown): Promise<T> => {
  const response = await authFetch(`/api/scout/${path}`, body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}). Please try again.`);
  return data as T;
};

const decisionBody = (entry: Entry) => {
  const forFacilitator = endorsers(entry.person).length > 0 ? entry.note?.trim() : '';
  return { id: entry.person.id, decision: entry.decision, ...(forFacilitator ? { note: forFacilitator } : {}) };
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

// A decision waits this long before it is saved, so it can be undone. Exported for tests.
export const UNDO_SECONDS = 5;
const PRELOAD_AHEAD = 5;
// How long the background reads and the shortlist button wait, at most, for the first card
const FIRST_CARD_WAIT_MS = 8000;
const wait = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

// The Monday (UTC) a week starts on, as the server counts invites
const weekOf = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7))).toISOString().slice(0, 10);
const dayMonth = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : undefined);

// What the lead reads when someone else got there first. Exported for tests.
export const alreadyHandledText = (name: string, result: DecisionResult) => {
  const on = dayMonth(result.on);
  const when = on ? ` on ${on}` : '';
  if (result.already === 'Invited') return `${name} was already invited${when}, so yours didn’t go through.`;
  if (result.already === 'Pass') return `${name} was already passed${when}, so yours didn’t go through.`;
  return `${name}: ${result.reason ?? 'this person is no longer in the queue.'}`;
};

export const failedText = (name: string, decision: Decision) => (decision === 'invite'
  ? `Your invite for ${name} didn’t go through, sorry! Please try again.`
  : `Your pass on ${name} didn’t go through, sorry! Please try again.`);

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
  const leadCoursesRef = useRef<Course[]>([]);
  const [leadName, setLeadName] = useState<string>();
  // Set after mount: the page is prerendered, and the hour there is not the lead's hour
  const [greetingText, setGreetingText] = useState('');
  useEffect(() => {
    setGreetingText(greeting(leadName));
  }, [leadName]);
  const [invited, setInvited] = useState<InvitedThisWeek>({});
  const invitedRef = useRef<InvitedThisWeek>({});
  const [loading, setLoading] = useState(true);
  const [othersLoading, setOthersLoading] = useState(false);
  const [othersFailed, setOthersFailed] = useState(false);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [backlogFailed, setBacklogFailed] = useState(false);
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
  const loadsInFlight = useRef(0);
  // Bumped whenever a card request settles, current or stale, so loading ahead always resumes
  const [loadsSettled, setLoadsSettled] = useState(0);
  const generation = useRef(0);
  // Saved decisions; the ones still saving; and the latest one, held for UNDO_SECONDS before saving
  const [done, setDone] = useState<Record<string, Entry>>({});
  const [inFlight, setInFlight] = useState<Record<string, Entry>>({});
  const [staged, setStaged] = useState<Staged>();
  const stagedRef = useRef<Staged>();
  // What moved the last person on, so the next card slides in the same way
  const [lastMove, setLastMove] = useState<Move>();
  const stageTimer = useRef<ReturnType<typeof setTimeout>>();
  const writeChain = useRef<Promise<void>>(Promise.resolve());
  const [secondsLeft, setSecondsLeft] = useState(UNDO_SECONDS);
  // People someone else already handled, and decisions whose save failed
  const [gone, setGone] = useState<string[]>([]);
  const [retries, setRetries] = useState<Retry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  // The endorsed-person box, which asks for a note to the facilitator before the decision is held
  const [confirmation, setConfirmation] = useState<Entry>();
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<string>();
  const [searchOpen, setSearchOpen] = useState(false);
  // Invites saved since the queue was loaded; the next load counts them in invitedThisWeek
  const [freshInvites, setFreshInvites] = useState<{ course: Course; week: string }[]>([]);
  const committedInvitesRef = useRef(0);
  const currentIdRef = useRef<string>();
  const [goalPopup, setGoalPopup] = useState(false);
  const [sessionNote, setSessionNote] = useState<SessionNote>();
  // Decisions already made when the current queue was opened, so its note only covers this visit
  const doneAtOpen = useRef(new Set<string>());
  // ?viewAs=email shows the page as that lead sees it: their courses and their goal
  const viewAs = typeof router.query.viewAs === 'string' ? router.query.viewAs : undefined;
  const promptOpen = useNavigationState((state) => state.promptOpen);
  const setSessionActive = useNavigationState((state) => state.setSessionActive);

  // The URL carries the person being looked up, so a card can be shared as a link
  const setPersonInUrl = useCallback((id?: string) => {
    const query = { ...router.query };
    if (id) query.person = id;
    else delete query.person;
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router]);

  const commit = useCallback((entry: Entry) => {
    const { id } = entry.person;
    setInFlight((state) => ({ ...state, [id]: entry }));
    // One save at a time, in the order they were made
    writeChain.current = writeChain.current.then(async () => {
      try {
        const result = await request<DecisionResult>('decision', decisionBody(entry));
        if (!result.ok) {
          setGone((state) => [...state, id]);
          setAlerts((state) => [...state, { id: `${id}-handled`, text: alreadyHandledText(entry.person.name, result), tone: 'error' }]);
          return;
        }

        setDone((state) => ({ ...state, [id]: entry }));
        if (entry.decision === 'invite' && leadCoursesRef.current.includes(entry.item.course)) {
          if (committedInvitesRef.current + 1 === WEEKLY_INVITE_GOAL) setGoalPopup(true);
          committedInvitesRef.current += 1;
          setFreshInvites((state) => [...state, { course: entry.item.course, week: weekOf() }]);
        }
      } catch {
        // The "just now" note only counts saved work
        setSessionNote((summary) => {
          if (!summary) return summary;
          return entry.decision === 'invite'
            ? { ...summary, invited: summary.invited.filter((name) => name !== entry.person.name) }
            : { ...summary, declined: Math.max(0, summary.declined - 1) };
        });
        if (entry.fromLookup) {
          setAlerts((state) => [...state, { id: `${id}-failed`, text: failedText(entry.person.name, entry.decision), tone: 'warning' }]);
        } else {
          setRetries((state) => [...state.filter((r) => r.id !== id), { id, decision: entry.decision, after: currentIdRef.current }]);
        }
      } finally {
        setInFlight((state) => {
          const next = { ...state };
          delete next[id];
          return next;
        });
      }
    });
  }, []);

  const flush = useCallback(() => {
    const pending = stagedRef.current;
    if (!pending) return;
    clearTimeout(stageTimer.current);
    stagedRef.current = undefined;
    setStaged(undefined);
    commit(pending);
  }, [commit]);

  const stage = useCallback((entry: Entry) => {
    // Only the latest decision can be undone: a new one saves the previous one now
    flush();
    setLastMove(entry.decision);
    const held: Staged = { ...entry, until: Date.now() + (UNDO_SECONDS * 1000) };
    stagedRef.current = held;
    setStaged(held);
    setRetries((state) => state.filter((r) => r.id !== entry.person.id).map((r) => (r.after === entry.person.id ? { ...r, after: undefined } : r)));
    stageTimer.current = setTimeout(() => {
      if (stagedRef.current !== held) return;
      stagedRef.current = undefined;
      setStaged(undefined);
      commit(held);
    }, UNDO_SECONDS * 1000);
  }, [commit, flush]);

  const undo = useCallback(() => {
    const pending = stagedRef.current;
    if (!pending) return;
    clearTimeout(stageTimer.current);
    stagedRef.current = undefined;
    setStaged(undefined);
    setLastMove(undefined);
    if (pending.fromLookup) {
      setLookup(pending.item);
      setPersonInUrl(pending.item.id);
    }
  }, [setPersonInUrl]);

  // A held decision counts as an unsaved change, so the portal waits for it before signing out
  const holding = staged !== undefined;
  useEffect(() => {
    if (!holding) return undefined;
    useNavigationState.setState((state) => ({ pendingWrites: state.pendingWrites + 1 }));
    return () => useNavigationState.setState((state) => ({ pendingWrites: state.pendingWrites - 1 }));
  }, [holding]);

  // Closing or reloading the tab sends a held decision straight away; keepalive lets it finish
  useEffect(() => {
    const onPageHide = () => {
      const pending = stagedRef.current;
      if (!pending) return;
      clearTimeout(stageTimer.current);
      stagedRef.current = undefined;
      // A page restored from the back/forward cache shows it as handled, not still held
      setStaged(undefined);
      setDone((state) => ({ ...state, [pending.person.id]: pending }));
      void authFetch('/api/scout/decision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(decisionBody(pending)), keepalive: true,
      });
    };

    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  // A held decision is saved, not dropped, when the page goes away
  useEffect(() => () => {
    const pending = stagedRef.current;
    if (!pending) return;
    clearTimeout(stageTimer.current);
    commit(pending);
  }, [commit]);

  useEffect(() => {
    if (!staged) return undefined;
    const tick = () => setSecondsLeft(Math.max(1, Math.ceil((staged.until - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [staged]);

  const loadPerson = useCallback((id: string): Promise<void> | undefined => {
    if (requested.current.has(id)) return undefined;
    requested.current.add(id);
    loadsInFlight.current += 1;
    const requestedGeneration = generation.current;
    setPeople((state) => {
      const next = { ...state };
      delete next[id];
      return next;
    });
    return request<{ person: Person }>(`person/${id}`)
      .then((data) => {
        if (requestedGeneration === generation.current) setPeople((state) => ({ ...state, [id]: { person: data.person } }));
      })
      .catch((error: unknown) => {
        if (requestedGeneration !== generation.current) return;
        requested.current.delete(id);
        setPeople((state) => ({ ...state, [id]: { error: message(error) } }));
      })
      .finally(() => {
        loadsInFlight.current -= 1;
        setLoadsSettled((count) => count + 1);
      });
  }, []);

  const loadQueue = useCallback(async () => {
    flush();
    generation.current += 1;
    const queueGeneration = generation.current;
    const withViewAs = (path: string) => (viewAs ? `${path}${path.includes('?') ? '&' : '?'}viewAs=${encodeURIComponent(viewAs)}` : path);
    setLoading(true);
    // A newer load owns these; a reply to an older one can no longer clear them
    setOthersLoading(false);
    setBacklogLoading(false);
    setOthersFailed(false);
    setBacklogFailed(false);
    setQueueError(undefined);
    try {
      // The lead's own courses first; the rest load behind them
      const data = await request<QueueResponse>(withViewAs('queue'));
      if (queueGeneration !== generation.current) return;
      setItems(data.items);
      const counts = data.invitedThisWeek ?? {};
      const previous = invitedRef.current;
      // An invite reaches these counts once Airtable stamps its date, a few seconds after it is sent;
      // until a count rises it stays counted here. A falling count means a new week.
      setFreshInvites((pending) => {
        const kept: { course: Course; week: string }[] = [];
        const absorbed = new Map<Course, number>();
        pending.forEach((entry) => {
          const rise = (counts[entry.course]?.total ?? 0) - (previous[entry.course]?.total ?? 0);
          if (rise < 0) return;
          const used = absorbed.get(entry.course) ?? 0;
          if (used < rise) absorbed.set(entry.course, used + 1);
          else kept.push(entry);
        });
        return kept;
      });
      invitedRef.current = counts;
      setInvited(counts);
      setLeadCourses(data.leadCourses ?? []);
      leadCoursesRef.current = data.leadCourses ?? [];
      setLeadName(data.leadName);
      setSkipOrder([]);
      setPeople({});
      requested.current.clear();
      setLoading(false);
      const later = data.later ?? [];
      // Shown as loading from now, so a shared link to someone in them waits for them
      later.forEach(({ part }) => (part === 'backlog' ? setBacklogLoading : setOthersLoading)(true));
      // The server queues Airtable reads, so the lead's first card goes before the backlog and other courses
      const first = courses.filter((course) => data.leadCourses?.includes(course)).map((course) => mustLookFor(data.items, course)).find((list) => list.length > 0)?.[0];
      // Capped, so a card that hangs doesn't hold the rest back
      if (first) await Promise.race([loadPerson(first.id), wait(FIRST_CARD_WAIT_MS)]);
      if (queueGeneration !== generation.current) return;
      // The lead's backlog and the other courses, side by side. A failure says so on the page;
      // a reply from an older load is dropped.
      await Promise.all(later.map(async ({ courses: wanted, part }) => {
        const setPartLoading = part === 'backlog' ? setBacklogLoading : setOthersLoading;
        const setPartFailed = part === 'backlog' ? setBacklogFailed : setOthersFailed;
        try {
          const rest = await request<QueueResponse>(withViewAs(`queue?courses=${encodeURIComponent(wanted.join(','))}&part=${part}`));
          if (queueGeneration === generation.current) setItems((state) => mergeItems(state, rest.items));
        } catch {
          if (queueGeneration === generation.current) setPartFailed(true);
        } finally {
          if (queueGeneration === generation.current) setPartLoading(false);
        }
      }));
    } catch (error) {
      if (queueGeneration === generation.current) {
        setQueueError(message(error));
        setLoading(false);
      }
    }
  }, [viewAs, flush, loadPerson]);
  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const remaining = useMemo(
    () => items.filter((item) => !done[item.id] && !inFlight[item.id] && staged?.person.id !== item.id && !gone.includes(item.id)),
    [items, done, inFlight, staged, gone],
  );
  const inScope = (item: QueueItem) => {
    if (!round) return false;
    return mustLook ? item.course === round.course && item.mustLook : !item.mustLook && roundKey(item) === roundKey(round);
  };

  let scopeItems: QueueItem[] = [];
  if (round) scopeItems = mustLook ? mustLookFor(remaining, round.course) : remaining.filter(inScope);
  const retryIds = new Set(retries.map((r) => r.id));
  const skippedItems = skipOrder.map((id) => scopeItems.find((item) => item.id === id)).filter((item): item is QueueItem => item !== undefined);
  const queue = [...scopeItems.filter((item) => !skipOrder.includes(item.id) && !retryIds.has(item.id)), ...skippedItems.filter((item) => !retryIds.has(item.id))];
  // A failed save comes back right after the person that was on screen when it failed
  retries.forEach((retry) => {
    const item = scopeItems.find((entry) => entry.id === retry.id);
    if (!item) return;
    const at = retry.after ? queue.findIndex((entry) => entry.id === retry.after) : -1;
    queue.splice(at + 1, 0, item);
  });
  const current = lookup ?? queue[0];
  currentIdRef.current = current?.id;
  const retryOfCurrent = current ? retries.find((r) => r.id === current.id) : undefined;
  const loaded = current ? people[current.id] : undefined;
  const person = loaded && 'person' in loaded ? loaded.person : undefined;
  const handled = new Map([...Object.values(done), ...Object.values(inFlight), ...(staged ? [staged] : [])].map((entry) => [entry.person.id, entry]));
  const decisions = [...handled.values()].filter((entry) => inScope(entry.item));
  const total = scopeItems.length + decisions.length;
  let scopeLabel = '';
  if (round) scopeLabel = mustLook ? 'Shortlist' : roundLabel(round);

  // Next backlog round of the same course that still has people; other courses, and the backlog
  // after must look, are a deliberate choice on the main page
  const nextRound = round && !mustLook ? roundsFor(remaining.filter((item) => !item.mustLook), round.course).find((item) => roundKey(item) !== roundKey(round)) : undefined;
  // Everyone left in the queue has been skipped once: say so instead of silently showing the first skip again
  const allSkipped = scopeItems.length > 0 && scopeItems.every((item) => skipOrder.includes(item.id)) && retries.every((r) => !scopeItems.some((item) => item.id === r.id));
  const projectUrl = allSkipped ? undefined : person?.projects.find((p) => p.url)?.url;
  const linkedInUrl = allSkipped ? undefined : [person?.profileUrl, person?.application?.profileUrl, person?.application?.otherProfileUrl].find((u) => u !== undefined && isLinkedIn(u));
  const cardOpen = lookup !== undefined || (round !== undefined && !allSkipped && current !== undefined);
  const thisWeek = weekOf();
  const committedInvites = leadCourses.reduce((sum, course) => sum + (invited[course]?.total ?? 0), 0)
    + freshInvites.filter((entry) => entry.week === thisWeek && leadCourses.includes(entry.course)).length;
  useEffect(() => {
    committedInvitesRef.current = committedInvites;
  }, [committedInvites]);
  const weeklyInvites = committedInvites + [...Object.values(inFlight), ...(staged ? [staged] : [])].filter((entry) => entry.decision === 'invite' && leadCourses.includes(entry.item.course)).length;
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

    flush();
    setRound(undefined);
    setMustLook(false);
    setSkipOrder([]);
    setNotice(undefined);
    setGoalPopup(false);
  }, [round, current, decisions, skippedItems, flush]);

  useEffect(() => {
    if (!sessionNote) return undefined;
    const timer = setTimeout(() => setSessionNote(undefined), 30_000);
    return () => clearTimeout(timer);
  }, [sessionNote]);

  const chooseRound = (item: QueueItem, asMustLook = false) => {
    if (confirmation !== undefined || promptOpen) return;
    // Like leaving the queue, moving to another round saves the held decision
    flush();
    doneAtOpen.current = new Set(handled.keys());
    setRound(item);
    setMustLook(asMustLook);
    setSkipOrder([]);
    setNotice(undefined);
    setSessionNote(undefined);
  };

  const chooseMustLook = (course: Course) => {
    const anchor = mustLookFor(remaining, course)[0];
    if (anchor) chooseRound(anchor, true);
  };

  const openLookup = (item: QueueItem) => {
    if (confirmation !== undefined || promptOpen) return;
    setLookup(item);
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
    // Someone in another course may still be loading
    if (!item && (othersLoading || backlogLoading)) return;
    if (item && !handled.has(item.id)) {
      setLookup(item);
    } else {
      setLookup(undefined);
      setNotice('That person is not in the queue right now.');
      setPersonInUrl(undefined);
    }
    // Runs when the URL parameter changes, not on every render that touches lookup or items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, queueError, linked, othersLoading, backlogLoading]);

  // Cards load one at a time ahead of the lead: the person on screen first, then the next few in
  // the queue, or on the main page the top of their shortlists
  let preload: QueueItem[] = [];
  if (lookup) {
    preload = [lookup];
  } else if (round) {
    preload = queue.slice(0, PRELOAD_AHEAD + 1);
  } else {
    const lists = courses.filter((course) => leadCourses.includes(course)).map((course) => mustLookFor(remaining, course));
    for (let i = 0; i < PRELOAD_AHEAD && preload.length < PRELOAD_AHEAD; i += 1) {
      lists.forEach((list) => {
        if (list[i] && preload.length < PRELOAD_AHEAD) preload.push(list[i]!);
      });
    }
  }

  const preloadIds = preload.map((item) => item.id).join(',');

  // A shortlist opens once its first card has loaded, so the first click never waits on Airtable
  const [stopPreparing, setStopPreparing] = useState(false);
  useEffect(() => {
    setStopPreparing(false);
    if (loading) return undefined;
    const timer = setTimeout(() => setStopPreparing(true), FIRST_CARD_WAIT_MS);
    return () => clearTimeout(timer);
  }, [loading]);
  const preparing = stopPreparing ? [] : leadCourses.filter((course) => {
    const firstId = mustLookFor(remaining, course)[0]?.id;
    return firstId !== undefined && !people[firstId];
  });
  useEffect(() => {
    if (loading || queueError) return;
    // A card that failed to load waits for the lead's Retry instead of being fetched again here
    const waiting = (id: string) => !requested.current.has(id) && !(people[id] && 'error' in people[id]);
    const ids = preloadIds ? preloadIds.split(',') : [];
    const [first] = ids;
    // The first person never waits behind a background load
    if (first && waiting(first)) {
      void loadPerson(first);
      return;
    }

    if (loadsInFlight.current > 0) return;
    const next = ids.find(waiting);
    if (next) void loadPerson(next);
  }, [preloadIds, people, loadsSettled, loading, queueError, loadPerson]);

  // A new person starts at the top of their card, however far down the previous one was read
  const currentId = current?.id;
  useEffect(() => {
    if (currentId) window.scrollTo({ top: 0 });
  }, [currentId]);

  const pendingSaves = Object.keys(inFlight).length + (staged ? 1 : 0);
  useEffect(() => {
    setSessionActive(!loading && !queueError && (scopeItems.length > 0 || lookup !== undefined || confirmation !== undefined || pendingSaves > 0));
    return () => setSessionActive(false);
  }, [loading, queueError, scopeItems.length, lookup, confirmation, pendingSaves, setSessionActive]);

  const skip = useCallback(() => {
    if (!current || lookup !== undefined || allSkipped || confirmation !== undefined || promptOpen) return;
    setSkipOrder((state) => [...state.filter((id) => id !== current.id), current.id]);
    setRetries((state) => state.filter((r) => r.id !== current.id).map((r) => (r.after === current.id ? { ...r, after: undefined } : r)));
    setNotice(undefined);
    setLastMove('skip');
  }, [current, lookup, allSkipped, confirmation, promptOpen]);

  const ask = useCallback((decision: Decision) => {
    if (!current || person?.id !== current.id || allSkipped || confirmation !== undefined || promptOpen) return;
    const entry: Entry = {
      person, decision, item: current, fromLookup: lookup !== undefined,
    };
    // Endorsed: the facilitator hears about it, so ask for an optional note first
    if (endorsers(person).length > 0) {
      setNote('');
      setConfirmation(entry);
      return;
    }

    stage(entry);
    if (lookup) closeLookup();
  }, [person, current, allSkipped, confirmation, promptOpen, lookup, stage, closeLookup]);

  const confirmNote = useCallback(() => {
    if (!confirmation) return;
    const entry = { ...confirmation, note };
    setConfirmation(undefined);
    stage(entry);
    if (entry.fromLookup) closeLookup();
  }, [confirmation, note, stage, closeLookup]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target instanceof HTMLElement ? event.target : undefined;
      if (target?.isContentEditable === true || target?.closest('input, textarea, select')) return;
      // The goal popup takes every key, so an Enter meant for it can never act on the next person
      if (goalPopup) return;
      // Enter confirms the open box, unless a button in it (Cancel, close) has focus; Esc is handled by the box itself
      if (confirmation !== undefined) {
        if (event.key === 'Enter' && !target?.closest('button, a, summary')) {
          event.preventDefault();
          confirmNote();
        }

        return;
      }

      // A clicked control keeps focus, so only the keys it uses itself go to it; the arrows, L, P and Z always work
      if (event.key === 'Enter' && target?.closest('button, a, summary')) return;
      if (event.key === ' ' && target?.closest('button, summary')) return;
      if (promptOpen || loading || queueError !== undefined) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => ask('invite'),
        ArrowLeft: () => ask('decline'),
        ArrowDown: skip,
        ...(cardOpen ? { ' ': openNextSection } : {}),
        l: () => {
          if (linkedInUrl) window.open(linkedInUrl, '_blank', 'noopener');
        },
        p: () => {
          if (projectUrl) window.open(projectUrl, '_blank', 'noopener');
        },
        z: undo,
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
  }, [ask, skip, undo, confirmNote, confirmation, goalPopup, promptOpen, loading, queueError, linkedInUrl, projectUrl, cardOpen, lookup, round, closeLookup, leaveRound]);

  const controlsDisabled = confirmation !== undefined || goalPopup || promptOpen;
  const dismissAlert = (id: string) => setAlerts((state) => state.filter((alert) => alert.id !== id));

  if (isLocalPreview()) return <PreviewNotice />;

  return (
    <div className="min-h-dvh bg-canvas p-3 sm:p-6">
      <Head><title>Course talent scouting · BlueDot Apps</title></Head>
      {staged && (
        <div role="status" className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-surface bg-primary px-4 py-2 text-size-sm text-white shadow-lg">
          <span>{staged.decision === 'invite' ? 'Invited' : 'Passed on'} {staged.person.name} · <button type="button" onClick={undo} className="font-semibold underline underline-offset-2">Undo</button> <kbd className="ml-1 rounded-sm border border-white/50 px-1 text-size-xxs">Z</kbd></span>
          <span aria-label={`Saving in ${secondsLeft} seconds`} className="grid size-6 place-items-center rounded-full border-2 border-white/70 text-size-xs font-semibold">{secondsLeft}</span>
        </div>
      )}
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {alerts.map((alert) => <Callout key={alert.id} tone={alert.tone} role="alert" onDismiss={() => dismissAlert(alert.id)}>{alert.text}</Callout>)}
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
            <ReviewEvidence key={lookup.id} item={lookup} person={person} error={loaded && 'error' in loaded ? loaded.error : undefined} onRetry={() => loadPerson(lookup.id)} actions={
              <div className="sticky bottom-0 rounded-b-overlay border-t border-subtle bg-canvas p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button variant="secondary" tone="destructive" disabled={!person || controlsDisabled} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</Button>
                  <Button disabled={!person || controlsDisabled} onClick={() => ask('invite')}>Invite <span aria-hidden>→</span></Button>
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
            <RoundPicker items={remaining} leadCourses={leadCourses} othersLoading={othersLoading} othersFailed={othersFailed} backlogLoading={backlogLoading} backlogFailed={backlogFailed} preparing={preparing} onSelect={chooseRound} onSelectMustLook={chooseMustLook} />
          </>
        ) : <>
          {/* Where the lead is, as one quiet line; progress and skips live in the action bar below the card */}
          <section aria-label="Review scope" className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-size-xs text-secondary"><span className="text-size-sm font-medium text-primary">{round.course}</span> · {scopeLabel}{current && !allSkipped && <span> · {decisions.length} of {total} reviewed</span>}</p>
            <Button variant="outline-black" size="small" disabled={controlsDisabled} onClick={leaveRound}>{mustLook ? 'Change queue' : 'Change round'}</Button>
          </section>
          {notice && <Callout role="status">{notice}</Callout>}
          {retryOfCurrent && current && <Callout tone="warning" role="alert">{failedText(current.name ?? 'this person', retryOfCurrent.decision)}</Callout>}
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
          {!allSkipped && (current ? <ReviewEvidence key={current.id} item={current} person={person} enteredBy={lastMove} error={loaded && 'error' in loaded ? loaded.error : undefined} onRetry={() => loadPerson(current.id)} actions={
            <div className="sticky bottom-0 flex flex-col gap-3 rounded-b-overlay border-t border-subtle bg-canvas p-4">
              <div className="flex flex-wrap items-center gap-3 text-size-xs text-secondary">
                {isLead && <span className={`font-medium ${weeklyInvites >= WEEKLY_INVITE_GOAL ? 'text-success-fg' : 'text-primary'}`}>{Math.min(weeklyInvites, WEEKLY_INVITE_GOAL)} / {WEEKLY_INVITE_GOAL} this week</span>}
                {isLead && <GoalDots invited={weeklyInvites} small />}
                <span className="ml-auto">{skippedItems.length} skipped</span>
                <Button variant="outline-black" size="small" disabled={controlsDisabled || skipOrder.length === 0} onClick={() => {
                  setSkipOrder((state) => state.slice(0, -1));
                  setNotice(undefined);
                }}>Undo skip</Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" tone="destructive" disabled={!person || controlsDisabled} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</Button>
                <Button variant="outline-black" disabled={controlsDisabled} onClick={skip}>Skip <span aria-hidden>↓</span></Button>
                <Button disabled={!person || controlsDisabled} onClick={() => ask('invite')}>Invite <span aria-hidden>→</span></Button>
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
          if (!open) setConfirmation(undefined);
        }} title={confirmation ? `Add a note for ${endorsers(confirmation.person).join(' and ')}?` : ''}>
          {confirmation && <div className="space-y-4 break-words text-size-sm">
            <p>
              {confirmation.decision === 'invite'
                ? `They endorsed ${confirmation.person.name}, so they’ll get an email saying you invited them. You can add a note to it.`
                : `They endorsed ${confirmation.person.name}, so they’ll get an email saying you won’t be inviting them this time. A short note on why helps them calibrate future endorsements.`}
            </p>
            <Field label="Your note (optional)">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="Anything you would like to tell them?" />
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
                      <p key={x.label} className="whitespace-pre-wrap"><span className="font-semibold">{x.label}:</span> “{x.text?.trim()}”</p>
                    ))}
                  </div>
                ))}
              </div>
            </details>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" tone={confirmation.decision === 'invite' ? undefined : 'destructive'} onClick={() => setConfirmation(undefined)}>Cancel</Button>
              <Button tone={confirmation.decision === 'invite' ? undefined : 'destructive'} onClick={confirmNote}>{confirmation.decision === 'invite' ? 'Invite' : 'Don’t invite'}</Button>
            </div>
          </div>}
        </Modal>
        <Modal isOpen={goalPopup} setIsOpen={(open) => setGoalPopup(open)} title={`${WEEKLY_INVITE_GOAL} invites this week, woohoo! 🎉`}>
          <div className="space-y-4 text-size-sm">
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

const iconButton = 'flex size-11 items-center justify-center rounded-surface text-secondary hover:bg-tint hover:text-primary disabled:opacity-50';

const KeyHints: React.FC<{ back: string }> = ({ back }) => (
  <p className="mt-2 text-size-xs text-secondary"><kbd>Space</kbd> next section · <kbd>Esc</kbd> {back}</p>
);

const SessionDecisions: React.FC<{ decisions: Entry[] }> = ({ decisions }) => {
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
