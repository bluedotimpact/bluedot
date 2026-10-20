import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Callout, Button, Modal, ProgressDots,
} from '@bluedot/ui';
import { authFetch } from '../../lib/client/api';
import { useNavigationState } from '../../lib/client/navigation';
import { isLocalPreview } from '../../lib/preview';
import { ReviewEvidence } from './ReviewEvidence';
import { RoundPicker } from './RoundPicker';
import { PersonSearch } from './PersonSearch';
import { openNextSection } from './sectionNav';
import {
  mustLookFor, roundKey, roundLabel, roundsFor,
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
  const [invited, setInvited] = useState<InvitedThisWeek>({});
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string>();
  const [round, setRound] = useState<QueueItem>();
  // Must look reviews a course's must-look people across rounds; `round` then only names the course
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
  const [writing, setWriting] = useState(false);
  const writingRef = useRef(false);
  const [saveError, setSaveError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<string>();
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
      const data = await request<{ items: QueueItem[]; invitedThisWeek?: InvitedThisWeek; leadCourses?: Course[]; leadName?: string }>('queue');
      if (queueGeneration !== generation.current) return;
      setItems(data.items);
      setInvited(data.invitedThisWeek ?? {});
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
  }, []);
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
  if (round) scopeLabel = mustLook ? 'Must look' : roundLabel(round);

  // Next backlog round of the same course that still has people; other courses, and the backlog
  // after must look, are a deliberate choice on the main page
  const nextRound = round && !mustLook ? roundsFor(remaining.filter((item) => !item.mustLook), round.course).find((item) => roundKey(item) !== roundKey(round)) : undefined;
  // Everyone left in the queue has been skipped once: say so instead of silently showing the first skip again
  const allSkipped = scopeItems.length > 0 && scopeItems.every((item) => skipOrder.includes(item.id));
  const linkedInUrl = allSkipped ? undefined : [person?.profileUrl, person?.application?.profileUrl, person?.application?.otherProfileUrl].find((u) => u !== undefined && isLinkedIn(u));
  const cardOpen = lookup !== undefined || (round !== undefined && !allSkipped && current !== undefined);

  const leaveRound = useCallback(() => {
    setRound(undefined);
    setMustLook(false);
    setSkipOrder([]);
    setNotice(undefined);
  }, []);

  const chooseRound = (item: QueueItem, asMustLook = false) => {
    if (writingRef.current || confirmation !== undefined || promptOpen) return;
    setRound(item);
    setMustLook(asMustLook);
    setSkipOrder([]);
    setSaveError(undefined);
    setConflict(false);
    setNotice(undefined);
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
      const result = await request<{ ok: boolean; reason?: string }>('decision', { id: selected.person.id, decision: selected.decision });
      if (!result.ok) {
        setConflict(true);
        setSaveError(result.reason ?? 'This participant is no longer available. Refresh the queue to continue.');
        setConfirmation(undefined);
        return;
      }

      setDone((state) => ({ ...state, [selected.person.id]: selected }));
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
  }, [confirmation, lookup, closeLookup]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target instanceof HTMLElement ? event.target : undefined;
      if (target?.isContentEditable === true || target?.closest('input, textarea, select')) return;
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
  }, [ask, skip, confirm, confirmation, promptOpen, loading, queueError, linkedInUrl, cardOpen, lookup, round, closeLookup, leaveRound]);

  const controlsDisabled = writing || confirmation !== undefined || promptOpen;
  let confirmDescription = 'This removes the participant from the queue and they won’t be considered again (unless the status is cleared in Airtable).';
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
            <header className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-size-lg font-semibold">{greeting(leadName)}</h1>
              <Button variant="outline-black" disabled={controlsDisabled || loading} onClick={() => {
                void loadQueue();
              }}>Refresh queue</Button>
            </header>
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
              <div className="rounded-b-overlay border-t border-subtle bg-canvas p-4">
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
            {notice && <Callout role="status">{notice}</Callout>}
            <PersonSearch items={remaining} query={search} onQueryChange={setSearch} onSelect={openLookup} />
            <RoundPicker items={remaining} invited={invited} leadCourses={leadCourses} onSelect={chooseRound} onSelectMustLook={chooseMustLook} />
          </>
        ) : <>
          <section aria-label="Review scope" className={`${panel} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-medium">{round.course}</p>
              <p className="text-size-xs text-secondary">{scopeLabel}</p>
              <p className="text-size-xs text-secondary">{decisions.length} of {total} reviewed{skippedItems.length > 0 && ` · ${skippedItems.length} skipped for now`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline-black" disabled={controlsDisabled || conflict || skipOrder.length === 0} onClick={() => {
                setSkipOrder((state) => state.slice(0, -1));
                setNotice(undefined);
              }}>Undo skip</Button>
              <Button variant="outline-black" disabled={controlsDisabled} onClick={leaveRound}>{mustLook ? 'Change queue' : 'Change round'}</Button>
            </div>
          </section>
          <progress aria-label="Review progress" max={total || 1} value={decisions.length} className="h-1.5 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-tint [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent" />
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
            <div className="rounded-b-overlay border-t border-subtle bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" tone="destructive" disabled={!person || controlsDisabled || conflict} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</Button>
                <Button variant="outline-black" disabled={controlsDisabled || conflict} onClick={skip}>Skip <span aria-hidden>↓</span></Button>
                <Button disabled={!person || controlsDisabled || conflict} onClick={() => ask('invite')}>Invite <span aria-hidden>→</span></Button>
              </div>
              <KeyHints back="main page" />
            </div>
          } /> : <section className={`${panel} space-y-4 p-6`}>
            <h2 className="text-size-lg font-semibold">{mustLook ? 'Must look is clear' : 'Round done'} <span className="font-normal text-secondary">· {round.course}{!mustLook && ` ${scopeLabel}`}</span></h2>
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
            {writing && (
              <div className="flex items-center gap-2 text-size-xs text-secondary" role="status">
                <ProgressDots />
                <span>Saving to Airtable.</span>
              </div>
            )}
            {saveError && <p role="alert" className="text-error-fg">{saveError}</p>}
            <p className="text-size-xs text-secondary"><kbd>Enter</kbd> confirm · <kbd>Esc</kbd> cancel</p>
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
      <button type="button" className="min-h-11 underline" onClick={() => {
        const text = decisions.map(({ decision, person }) => `${decision === 'invite' ? 'Invitation requested' : 'Don’t invite'}: ${person.name} <${person.email}>`).join('\n');
        void navigator.clipboard.writeText(text).then(() => setCopyStatus('Copied')).catch(() => setCopyStatus('Could not copy. Select the text above instead.'));
      }}>Copy decisions</button>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </div>
  );
};

export default Scout;
