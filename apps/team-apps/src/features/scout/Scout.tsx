import Link from 'next/link';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  CTALinkOrButton, H1, Modal, ProgressDots,
} from '@bluedot/ui';
import { authFetch } from '../../lib/client/api';
import { useNavigationState } from '../../lib/client/navigation';
import { isLocalPreview } from '../../lib/preview';
import { PersonCard } from './PersonCard';
import type {
  Course, Decision, Person, QueueItem,
} from './types';

const COURSES: { course: Course; label: string }[] = [
  { course: 'Technical AI Safety', label: 'TAIS' },
  { course: 'Technical AI Safety Project', label: 'TAIS Project' },
  { course: 'Biosecurity', label: 'Biosecurity' },
];
type Loaded = { person: Person } | { error: string };
type Done = { decision: Decision; person: Person };
type Confirmation = { decision: Decision; person: Person };

const request = async <T,>(path: string, body?: unknown): Promise<T> => {
  const response = await authFetch(`/api/scout/${path}`, body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}). Please try again.`);
  return data as T;
};

const message = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong. Please try again.');

const Scout = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueError, setQueueError] = useState<string>();
  const [course, setCourse] = useState<Course>('Technical AI Safety');
  const [people, setPeople] = useState<Record<string, Loaded>>({});
  const requested = useRef(new Set<string>());
  const generation = useRef(0);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Record<string, Done>>({});
  const [showName, setShowName] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [writing, setWriting] = useState(false);
  const writingRef = useRef(false);
  const [saveError, setSaveError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<string>();
  const promptOpen = useNavigationState((state) => state.promptOpen);
  const setSessionActive = useNavigationState((state) => state.setSessionActive);
  const preview = isLocalPreview();

  const loadQueue = useCallback(async () => {
    if (writingRef.current) return;
    generation.current += 1;
    setLoading(true);
    setQueueError(undefined);
    setSaveError(undefined);
    setConflict(false);
    try {
      const data = await request<{ items: QueueItem[] }>('queue');
      setItems(data.items);
      setSkipped(new Set());
      setPeople({});
      requested.current.clear();
    } catch (error) {
      setQueueError(message(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const remaining = useMemo(() => items.filter((item) => !done[item.id]), [items, done]);
  const courseItems = remaining.filter((item) => item.course === course);
  const queue = courseItems.filter((item) => !skipped.has(item.id));
  const current = queue[0];
  const upcoming = queue[1];
  const loaded = current ? people[current.id] : undefined;
  const person = loaded && 'person' in loaded ? loaded.person : undefined;
  const skippedCount = courseItems.filter((item) => skipped.has(item.id)).length;
  const decisions = Object.values(done).filter((entry) => entry.person.course === course);

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
    setSessionActive(!loading && !queueError && (courseItems.length > 0 || confirmation !== undefined));
    return () => setSessionActive(false);
  }, [loading, queueError, courseItems.length, confirmation, setSessionActive]);

  const skip = useCallback(() => {
    if (!current || writingRef.current || confirmation !== undefined || promptOpen || conflict) return;
    setSkipped((state) => new Set([...state, current.id]));
    setSaveError(undefined);
  }, [current, confirmation, promptOpen, conflict]);

  const ask = useCallback((decision: Decision) => {
    if (!person || person.id !== current?.id || writingRef.current || confirmation !== undefined || promptOpen || conflict) return;
    setSaveError(undefined);
    setConfirmation({ person, decision });
  }, [person, current?.id, confirmation, promptOpen, conflict]);

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
      if (writingRef.current || confirmation !== undefined || promptOpen || loading || queueError !== undefined) return;
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
  }, [ask, skip, confirmation, promptOpen, loading, queueError]);

  const controlsDisabled = writing || confirmation !== undefined || promptOpen;
  let confirmDescription = 'This saves the decision and removes this participant from the queue. You can change the status later in Airtable.';
  if (confirmation?.decision === 'invite') confirmDescription = 'This saves the decision and asks Airtable to email this participant from the course lead. You cannot undo the email here.';
  if (preview) confirmDescription = 'This saves a sample decision only. No email will be sent.';
  let confirmLabel = confirmation?.decision === 'invite' ? 'Send invitation' : 'Confirm don’t invite';
  if (saveError) confirmLabel = 'Retry save';
  if (writing) confirmLabel = 'Saving…';

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-canvas px-3 py-6 sm:px-6 md:min-h-dvh">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Link href="/scout/designs/inbox" className="inline-flex min-h-11 items-center justify-between gap-3 rounded-surface border border-info-border bg-info-bg px-4 py-3 text-size-sm font-medium text-info-fg">Compare three new Scout layouts <span aria-hidden="true">→</span></Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><H1 className="text-size-xl">Scout</H1><p className="mt-1 text-size-sm text-secondary">Find course participants to invite to an evaluation call.</p></div>
          <button type="button" onClick={() => {
            void loadQueue();
          }} disabled={controlsDisabled || loading} className="min-h-11 rounded-surface border border-subtle px-3 text-size-sm hover:bg-tint disabled:opacity-50">Refresh queue</button>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Course">
          {COURSES.map(({ course: value, label }) => (
            <button key={value} type="button" aria-pressed={course === value} disabled={controlsDisabled} onClick={() => {
              setCourse(value);
              setSaveError(undefined);
              setConflict(false);
            }} className={`min-h-11 rounded-surface px-3 text-size-sm disabled:opacity-50 ${course === value ? 'bg-accent text-on-dark' : 'bg-raised text-primary hover:bg-tint'}`}>
              {label} <span className="ml-1 opacity-70">{remaining.filter((item) => item.course === value).length}</span>
            </button>
          ))}
        </div>
        {loading && <div role="status" aria-label="Loading queue" className="py-12"><ProgressDots /></div>}
        {!loading && queueError && (
          <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{queueError} Use Refresh queue to try again.</div>
        )}
        {!loading && !queueError && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-size-sm text-secondary">
              <p>{queue.length} remaining{skippedCount > 0 ? ` · ${skippedCount} skipped` : ''}</p>
              <button type="button" onClick={() => setShowName((value) => !value)} className="min-h-11 px-2 underline">{showName ? 'Hide names' : 'Show names'} (n)</button>
            </div>
            <p className="text-size-xs text-secondary">{preview ? 'Sample data. Decisions stay in this preview and send no emails.' : 'Inviting sends an email. Both decisions save to Airtable after confirmation. Skip makes no changes.'}</p>
            {notice && <p role="status" className="rounded-surface bg-info-bg p-3 text-size-sm text-info-fg">{notice}</p>}
            {saveError && !confirmation && <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{saveError}</div>}
            {current ? (
              <>
                {!loaded && <div role="status" aria-label="Loading participant" className="py-8"><ProgressDots /></div>}
                {loaded && 'error' in loaded && <div role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg"><p>{loaded.error}</p><button type="button" className="mt-2 min-h-11 underline" onClick={() => loadPerson(current.id)}>Retry participant</button></div>}
                {person && <PersonCard key={person.id} person={person} showName={showName} />}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-surface border border-subtle bg-raised p-3">
                  <button type="button" onClick={() => ask('decline')} disabled={!person || controlsDisabled || conflict} className="min-h-11 rounded-surface border border-error-border px-3 text-size-sm font-medium text-error-fg hover:bg-error-bg disabled:opacity-50">← Don’t invite</button>
                  <button type="button" onClick={skip} disabled={controlsDisabled || conflict} className="min-h-11 px-3 text-size-sm text-secondary underline disabled:opacity-50">↓ Skip</button>
                  <CTALinkOrButton className="min-h-11" onClick={() => ask('invite')} disabled={!person || controlsDisabled || conflict}>Invite →</CTALinkOrButton>
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-surface border border-subtle bg-raised p-6">
                <p className="font-medium">{skippedCount > 0 ? 'You’ve reached the end of this queue.' : 'Nobody left to review for this course.'}</p>
                <p className="text-size-sm text-secondary">This session: {decisions.filter((entry) => entry.decision === 'invite').length} invited · {decisions.filter((entry) => entry.decision === 'decline').length} marked don’t invite.</p>
                <SessionDecisions decisions={decisions} />
                {skippedCount > 0 && <CTALinkOrButton className="min-h-11" variant="secondary" onClick={() => setSkipped((state) => new Set([...state].filter((id) => !courseItems.some((item) => item.id === id))))}>Review skipped participants</CTALinkOrButton>}
              </div>
            )}
          </>
        )}
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
            <p className="font-medium">{decision === 'invite' ? 'Invited' : 'Don’t invite'}</p>
            <ul className="mt-1 space-y-1 break-words">{selected.map(({ person }) => <li key={person.id}>{person.name} <span className="text-secondary">{person.email}</span></li>)}</ul>
          </div>
        );
      })}
      <button type="button" className="min-h-11 underline" onClick={() => {
        const text = decisions.map(({ decision, person }) => `${decision === 'invite' ? 'Invited' : 'Don’t invite'}: ${person.name} <${person.email}>`).join('\n');
        void navigator.clipboard.writeText(text).then(() => setCopyStatus('Copied')).catch(() => setCopyStatus('Could not copy. Select the text above instead.'));
      }}>Copy decisions</button>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </div>
  );
};

export default Scout;
