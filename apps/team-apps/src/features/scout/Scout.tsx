import Head from 'next/head';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  CTALinkOrButton, Modal, ProgressDots,
} from '@bluedot/ui';
import { authFetch } from '../../lib/client/api';
import { useNavigationState } from '../../lib/client/navigation';
import { isLocalPreview } from '../../lib/preview';
import { ReviewEvidence } from './ReviewEvidence';
import { RoundPicker } from './RoundPicker';
import { QueueSource } from './QueueSource';
import {
  courses, roundKey, roundLabel, roundsFor,
} from './reviewQueue';
import {
  button, danger, dangerSolid, primary, panel,
} from './reviewStyles';
import type {
  Decision, InvitedThisWeek, Person, QueueItem,
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
  const [invited, setInvited] = useState<InvitedThisWeek>({});
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string>();
  const [round, setRound] = useState<QueueItem>();
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
      const data = await request<{ items: QueueItem[]; invitedThisWeek?: InvitedThisWeek }>('queue');
      if (queueGeneration !== generation.current) return;
      setItems(data.items);
      setInvited(data.invitedThisWeek ?? {});
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
  const roundItems = round ? remaining.filter((item) => roundKey(item) === roundKey(round)) : [];
  const skippedItems = skipOrder.map((id) => roundItems.find((item) => item.id === id)).filter((item): item is QueueItem => item !== undefined);
  const queue = [...roundItems.filter((item) => !skipOrder.includes(item.id)), ...skippedItems];
  const current = queue[0];
  const upcoming = queue[1];
  const loaded = current ? people[current.id] : undefined;
  const person = loaded && 'person' in loaded ? loaded.person : undefined;
  const decisions = Object.values(done).filter((entry) => round && roundKey(entry.item) === roundKey(round));
  const total = roundItems.length + decisions.length;

  // Next round in picker order that still has people
  const nextRound = round ? courses.flatMap((course) => roundsFor(remaining, course)).find((item) => roundKey(item) !== roundKey(round)) : undefined;

  const chooseRound = (item: QueueItem) => {
    if (writingRef.current || confirmation !== undefined || promptOpen) return;
    setRound(item);
    setSkipOrder([]);
    setSaveError(undefined);
    setConflict(false);
    setNotice(undefined);
  };

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
    setSessionActive(!loading && !queueError && (roundItems.length > 0 || confirmation !== undefined));
    return () => setSessionActive(false);
  }, [loading, queueError, roundItems.length, confirmation, setSessionActive]);

  const skip = useCallback(() => {
    if (!current || writingRef.current || confirmation !== undefined || promptOpen || conflict) return;
    setSkipOrder((state) => [...state.filter((id) => id !== current.id), current.id]);
    setNotice(undefined);
    setSaveError(undefined);
  }, [current, confirmation, promptOpen, conflict]);

  const ask = useCallback((decision: Decision) => {
    if (!current || person?.id !== current.id || writingRef.current || confirmation !== undefined || promptOpen || conflict) return;
    setSaveError(undefined);
    setConfirmation({ person, decision, item: current });
  }, [person, current, confirmation, promptOpen, conflict]);

  const confirm = async () => {
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
      setNotice(selected.decision === 'invite' ? 'Invitation requested. Airtable will send the email.' : 'Saved as don’t invite.');
    } catch (error) {
      setSaveError(message(error));
    } finally {
      writingRef.current = false;
      setWriting(false);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest('input, textarea, select, button, a, summary, [role="dialog"]'))) return;
      if (writingRef.current || confirmation !== undefined || promptOpen || loading || queueError !== undefined) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => ask('invite'), ArrowLeft: () => ask('decline'), ArrowDown: skip,
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask, skip, confirmation, promptOpen, loading, queueError]);

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
        {!round && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div><h1 className="text-size-lg font-semibold">Course talent scouting</h1><p className="mt-1 text-size-sm text-secondary">Which course participant should get an evaluation call?</p></div>
              <button type="button" className={button} disabled={controlsDisabled || loading} onClick={() => {
                void loadQueue();
              }}>Refresh queue</button>
            </header>
            {!loading && !queueError && <QueueSource count={remaining.length} />}
          </>
        )}
        {loading && <div role="status" aria-label="Loading queue" className="py-12"><ProgressDots /></div>}
        {!loading && queueError && <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{queueError} Use Refresh queue to try again.</div>}
        {!loading && !queueError && (!round ? (
          <RoundPicker items={remaining} invited={invited} onSelect={chooseRound} />
        ) : <>
          <section aria-label="Review scope" className={`${panel} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-medium">{round.course}</p>
              <p className="text-size-xs text-secondary">{roundLabel(round)}</p>
              <p className="text-size-xs text-secondary">{decisions.length} of {total} reviewed{skippedItems.length > 0 && ` · ${skippedItems.length} skipped for now`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={controlsDisabled || conflict || skipOrder.length === 0} onClick={() => {
                setSkipOrder((state) => state.slice(0, -1));
                setNotice(undefined);
              }}>Undo skip</button>
              <button type="button" className={button} disabled={controlsDisabled} onClick={() => {
                setRound(undefined);
                setSkipOrder([]);
                setNotice(undefined);
              }}>Change round</button>
            </div>
          </section>
          <progress aria-label="Review progress" max={total || 1} value={decisions.length} className="h-1.5 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-tint [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent" />
          {notice && <p role="status" className="rounded-surface bg-info-bg p-3 text-size-sm text-info-fg">{notice}</p>}
          {saveError && !confirmation && <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{saveError}</div>}
          {current ? <ReviewEvidence key={current.id} item={current} person={person} error={loaded && 'error' in loaded ? loaded.error : undefined} onRetry={() => loadPerson(current.id)} actions={
            <div className="rounded-b-overlay border-t border-subtle bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" className={danger} disabled={!person || controlsDisabled || conflict} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</button>
                <button type="button" className={button} disabled={controlsDisabled || conflict} onClick={skip}>Skip <span aria-hidden>↓</span></button>
                <button type="button" className={primary} disabled={!person || controlsDisabled || conflict} onClick={() => ask('invite')}>Invite <span aria-hidden>→</span></button>
              </div>
            </div>
          } /> : <section className={`${panel} space-y-4 p-6`}>
            <h2 className="text-size-lg font-semibold">Round done <span className="font-normal text-secondary">· {round.course} {roundLabel(round)}</span></h2>
            <p className="text-size-sm text-secondary">{decisions.filter((entry) => entry.decision === 'invite').length} invited · {decisions.filter((entry) => entry.decision === 'decline').length} marked don’t invite</p>
            <SessionDecisions decisions={decisions} />
            {decisions.length > 0 && <p className="max-w-prose text-size-xs leading-relaxed text-secondary">Decisions are saved in Airtable; the invite emails are sent from there.</p>}
            <div className="flex flex-wrap gap-2">
              {nextRound && <button type="button" className={primary} disabled={controlsDisabled} onClick={() => chooseRound(nextRound)}>Review next round <span aria-hidden>→</span></button>}
              <button type="button" className={button} disabled={controlsDisabled} onClick={() => {
                setRound(undefined);
                setSkipOrder([]);
                setNotice(undefined);
              }}>Back to main page</button>
            </div>
          </section>}
        </>)}
        <Modal isOpen={confirmation !== undefined} setIsOpen={(open) => {
          if (!open && !writingRef.current) {
            setConfirmation(undefined);
            setSaveError(undefined);
          }
        }} isDismissable={!writing} desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" title={confirmation?.decision === 'invite' ? 'Invite to an evaluation call?' : 'Mark as don’t invite?'}>
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
            <div className="flex flex-wrap justify-end gap-2">
              {confirmation.decision === 'invite' ? (
                <CTALinkOrButton className="min-h-11" variant="secondary" disabled={writing} onClick={() => {
                  setConfirmation(undefined);
                  setSaveError(undefined);
                }}>Cancel</CTALinkOrButton>
              ) : (
                <button type="button" className={danger} disabled={writing} onClick={() => {
                  setConfirmation(undefined);
                  setSaveError(undefined);
                }}>Cancel</button>
              )}
              {confirmation.decision === 'invite' ? (
                <CTALinkOrButton className="min-h-11" disabled={writing} onClick={() => {
                  void confirm();
                }}>{confirmLabel}</CTALinkOrButton>
              ) : (
                <button type="button" className={dangerSolid} disabled={writing} onClick={() => {
                  void confirm();
                }}>{confirmLabel}</button>
              )}
            </div>
          </div>}
        </Modal>
      </div>
    </div>
  );
};

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
