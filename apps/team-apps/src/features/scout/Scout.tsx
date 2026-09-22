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
import { roundKey, roundLabel } from './reviewQueue';
import {
  button, danger, primary, panel,
} from './reviewStyles';
import type {
  Decision, Person, QueueItem,
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

const ROUND_KEY = 'scout.round';

const message = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong. Please try again.');

const Scout = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string>();
  const [round, setRound] = useState<QueueItem>();
  const [direction, setDirection] = useState('top');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [skipHistory, setSkipHistory] = useState<string[]>([]);
  const [people, setPeople] = useState<Record<string, Loaded>>({});
  const requested = useRef(new Set<string>());
  const generation = useRef(0);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Record<string, Done>>({});
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [writing, setWriting] = useState(false);
  const writingRef = useRef(false);
  const [saveError, setSaveError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [showName, setShowName] = useState(false);
  const promptOpen = useNavigationState((state) => state.promptOpen);
  const setSessionActive = useNavigationState((state) => state.setSessionActive);
  const preview = isLocalPreview();

  const loadQueue = useCallback(async () => {
    if (writingRef.current) return;
    generation.current += 1;
    const queueGeneration = generation.current;
    setLoading(true);
    setQueueError(undefined);
    setSaveError(undefined);
    setConflict(false);
    try {
      const data = await request<{ items: QueueItem[] }>('queue');
      if (queueGeneration !== generation.current) return;
      setItems(data.items);
      setSkipped((state) => new Set([...state].filter((id) => data.items.some((item) => item.id === id))));
      setSkipHistory([]);
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

  // Land straight back in the round reviewed last time, if it still has people
  useEffect(() => {
    if (loading) return;
    if (round) return;
    if (items.length === 0) return;
    try {
      const remembered = window.localStorage.getItem(ROUND_KEY);
      const match = remembered ? items.find((item) => roundKey(item) === remembered) : undefined;
      if (match) setRound(match);
    } catch {
      // storage unavailable: show the picker
    }
  }, [loading, round, items]);

  const remaining = useMemo(() => items.filter((item) => !done[item.id]), [items, done]);
  const roundItems = round ? remaining.filter((item) => roundKey(item) === roundKey(round)) : [];
  const queue = roundItems.filter((item) => !skipped.has(item.id));
  if (direction === 'bottom') queue.reverse();
  const current = finished ? undefined : queue[0];
  const upcoming = finished ? undefined : queue[1];
  const loaded = current ? people[current.id] : undefined;
  const person = loaded && 'person' in loaded ? loaded.person : undefined;
  const skippedCount = roundItems.filter((item) => skipped.has(item.id)).length;
  const decisions = Object.values(done).filter((entry) => round && roundKey(entry.item) === roundKey(round));
  const total = roundItems.length + decisions.length;

  const chooseRound = (item: QueueItem) => {
    if (writingRef.current || confirmation !== undefined || promptOpen) return;
    setRound(item);
    try {
      window.localStorage.setItem(ROUND_KEY, roundKey(item));
    } catch {
      // storage unavailable: the round simply isn't remembered
    }

    setFinished(false);
    setPickerOpen(false);
    setSkipHistory([]);
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

  useEffect(() => {
    setSessionActive(!finished && !loading && !queueError && (roundItems.length > 0 || confirmation !== undefined));
    return () => setSessionActive(false);
  }, [finished, loading, queueError, roundItems.length, confirmation, setSessionActive]);

  const skip = useCallback(() => {
    if (!current || writingRef.current || confirmation !== undefined || pickerOpen || promptOpen || conflict) return;
    setSkipped((state) => new Set([...state, current.id]));
    setSkipHistory((state) => [...state, current.id]);
    setNotice(`${current.name ?? 'Participant'} skipped. Nothing was saved.`);
    setSaveError(undefined);
  }, [current, confirmation, pickerOpen, promptOpen, conflict]);

  const ask = useCallback((decision: Decision) => {
    if (!current || person?.id !== current.id || writingRef.current || confirmation !== undefined || pickerOpen || promptOpen || conflict) return;
    setSaveError(undefined);
    setConfirmation({ person, decision, item: current });
  }, [person, current, confirmation, pickerOpen, promptOpen, conflict]);

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
      setConfirmation(undefined);
      const inviteNotice = preview ? 'Sample invitation saved. No email was sent.' : 'Invitation requested. Airtable will send the email.';
      setNotice(selected.decision === 'invite' ? inviteNotice : 'Saved as don’t invite.');
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
      if (writingRef.current || confirmation !== undefined || pickerOpen || finished || promptOpen || loading || queueError !== undefined) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => ask('invite'), ArrowLeft: () => ask('decline'), ArrowDown: skip, n: () => setShowName((value) => !value),
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask, skip, confirmation, pickerOpen, finished, promptOpen, loading, queueError]);

  const controlsDisabled = writing || confirmation !== undefined || pickerOpen || promptOpen;
  let confirmDescription = 'This saves the decision and removes this participant from the queue. You can change the status later in Airtable.';
  if (confirmation?.decision === 'invite') confirmDescription = 'This saves the decision and asks Airtable to email this participant from the course lead. You cannot undo the email here.';
  if (preview) confirmDescription = 'This saves a sample decision only. No email will be sent.';
  let confirmLabel = confirmation?.decision === 'invite' ? 'Send invitation' : 'Confirm don’t invite';
  if (saveError) confirmLabel = 'Retry save';
  if (writing) confirmLabel = 'Saving…';

  return (
    <div className="min-h-dvh bg-canvas p-3 sm:p-6">
      <Head><title>Scout · BlueDot Apps</title></Head>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-size-lg font-semibold">Scout</h1><p className="mt-1 text-size-sm text-secondary">Who from a finished round should get an evaluation call?</p></div>
          <button type="button" className={button} disabled={controlsDisabled || loading} onClick={() => {
            void loadQueue();
          }}>Refresh queue</button>
        </header>
        <QueueSource count={remaining.length} demo={preview} />
        {loading && <div role="status" aria-label="Loading queue" className="py-12"><ProgressDots /></div>}
        {!loading && queueError && <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{queueError} Use Refresh queue to try again.</div>}
        {!loading && !queueError && (!round ? (
          <RoundPicker items={remaining} direction={direction} onDirection={setDirection} onSelect={chooseRound} />
        ) : <>
          <section aria-label="Review scope" className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div><p className="font-medium">{round.course}</p><p className="mt-1 text-size-xs text-secondary">{roundLabel(round)} · {direction === 'top' ? 'Top' : 'Bottom'} of Airtable queue</p></div>
            <button type="button" className={button} disabled={controlsDisabled} onClick={() => setPickerOpen(true)}>Change round</button>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-size-sm text-secondary">{decisions.length} reviewed · {queue.length} to review · {skippedCount} skipped</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => setShowName((value) => !value)}>{showName ? 'Hide names' : 'Show names'} (n)</button>
              <button type="button" className={button} disabled={controlsDisabled || conflict || skipHistory.length === 0} onClick={() => {
                const id = skipHistory.at(-1);
                if (!id) return;
                setSkipped((state) => new Set([...state].filter((value) => value !== id)));
                setSkipHistory((state) => state.slice(0, -1));
                setFinished(false);
                setNotice('Last skip undone.');
              }}>Undo skip</button>
              <button type="button" className={button} disabled={controlsDisabled || !current} onClick={() => setFinished(true)}>Finish session</button>
            </div>
          </div>
          <progress aria-label="Review progress" max={total || 1} value={decisions.length} className="h-1.5 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-tint [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent" />
          {notice && <p role="status" className="rounded-surface bg-info-bg p-3 text-size-sm text-info-fg">{notice}</p>}
          {saveError && !confirmation && <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{saveError}</div>}
          {current ? <ReviewEvidence key={current.id} item={current} person={person} showName={showName} error={loaded && 'error' in loaded ? loaded.error : undefined} onRetry={() => loadPerson(current.id)} actions={
            <div className="rounded-b-overlay border-t border-subtle bg-canvas p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" className={danger} disabled={!person || controlsDisabled || conflict} onClick={() => ask('decline')}><span aria-hidden>←</span> Don’t invite</button>
                <button type="button" className={button} disabled={controlsDisabled || conflict} onClick={skip}>Skip for now</button>
                <button type="button" className={primary} disabled={!person || controlsDisabled || conflict} onClick={() => ask('invite')}>Invite to a call <span aria-hidden>→</span></button>
              </div>
              <p className="mt-3 text-size-xs text-secondary">{preview ? 'Sample data: decisions send no emails.' : 'Invite and Don’t invite are for real, after you confirm. Skip changes nothing.'} Keys: ← don’t invite · ↓ skip · → invite · n names</p>
            </div>
          } /> : <section className={`${panel} space-y-4 p-6`}>
            <h2 className="text-size-lg font-semibold">Your session, at a glance.</h2>
            <p className="text-size-sm text-secondary">{decisions.filter((entry) => entry.decision === 'invite').length} invitation{decisions.filter((entry) => entry.decision === 'invite').length === 1 ? '' : 's'} requested · {decisions.filter((entry) => entry.decision === 'decline').length} marked don’t invite · {skippedCount} skipped · {queue.length} still to review</p>
            <SessionDecisions decisions={decisions} />
            {decisions.length > 0 && <p className="max-w-prose text-size-xs leading-relaxed text-secondary">{preview ? 'These are sample decisions. No email was sent.' : 'Confirmed decisions are saved in Airtable. Requested emails cannot be undone here. Delivery is handled by Airtable.'}</p>}
            {skippedCount > 0 && <button type="button" className={button} disabled={controlsDisabled} onClick={() => {
              setSkipped((state) => new Set([...state].filter((id) => !roundItems.some((item) => item.id === id))));
              setSkipHistory([]);
              setFinished(false);
              setNotice(undefined);
            }}>Review skipped participants</button>}
            {queue.length > 0 && <button type="button" className={primary} disabled={controlsDisabled} onClick={() => setFinished(false)}>Resume this round</button>}
          </section>}
        </>)}
        <Modal desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" isOpen={pickerOpen} setIsOpen={setPickerOpen} title="Choose a round">
          <RoundPicker items={remaining} direction={direction} onDirection={setDirection} onSelect={chooseRound} />
        </Modal>
        <Modal isOpen={confirmation !== undefined} setIsOpen={(open) => {
          if (!open && !writingRef.current) {
            setConfirmation(undefined);
            setSaveError(undefined);
          }
        }} isDismissable={!writing} desktopHeaderClassName="[&_button]:min-h-11 [&_button]:min-w-11" title={confirmation?.decision === 'invite' ? 'Invite to an evaluation call?' : 'Mark as don’t invite?'}>
          {confirmation && <div className="max-w-md space-y-4 break-words text-size-sm">
            <p className="font-semibold">{confirmation.person.name}</p>
            <p>{confirmDescription}</p>
            {saveError && <p role="alert" className="text-error-fg">{saveError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <CTALinkOrButton className="min-h-11" variant="secondary" disabled={writing} onClick={() => {
                setConfirmation(undefined);
                setSaveError(undefined);
              }}>Cancel</CTALinkOrButton>
              <CTALinkOrButton className="min-h-11" disabled={writing} onClick={() => {
                void confirm();
              }}>{confirmLabel}</CTALinkOrButton>
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
