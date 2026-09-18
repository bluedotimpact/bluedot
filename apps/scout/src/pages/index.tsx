import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import axios from 'axios';
import useAxios from 'axios-hooks';
import {
  CTALinkOrButton, ErrorSection, H1, P, ProgressDots, withAuth,
} from '@bluedot/ui';
import { PersonCard } from '../components/PersonCard';
import {
  type Course, type Decision, type Person, type QueueItem,
} from '../lib/client/types';

const COURSES: Course[] = ['Biosecurity', 'Technical AI Safety'];

// A fetched person, or the error from trying. Absent from the cache means not loaded yet.
type Loaded = { person: Person } | { error: unknown };

const HomePage = withAuth(({ auth }) => {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${auth.token}` }), [auth.token]);
  const [{ data: me, loading: meLoading, error: meError }] = useAxios<{ email: string; canAccess: boolean }>({ url: '/api/me', headers: authHeaders });

  if (meLoading) return <div className="section-body"><ProgressDots /></div>;
  if (meError) return <div className="section-body"><ErrorSection error={meError} /></div>;
  if (!me?.canAccess) {
    return (
      <div className="section-body gap-2">
        <H1>Scout</H1>
        <P>This tool is for course leads. You're signed in as {me?.email}.</P>
      </div>
    );
  }

  return <Review authHeaders={authHeaders} />;
});

export default HomePage;

const Review: React.FC<{ authHeaders: Record<string, string> }> = ({ authHeaders }) => {
  const [{ data, loading, error }] = useAxios<{ items: QueueItem[] }>({ url: '/api/queue', headers: authHeaders });
  const [course, setCourse] = useState<Course>('Biosecurity');
  const [index, setIndex] = useState(0);
  const [decided, setDecided] = useState<Record<string, Decision>>({});
  const [showName, setShowName] = useState(false);
  const [toast, setToast] = useState<string | undefined>();

  const queue = useMemo(() => (data?.items ?? []).filter((i) => i.course === course), [data, course]);
  const current = queue[index];

  // People cache, keyed by registration id (unique across courses). `requested` holds ids
  // already fetched or in flight so we never fetch the same person twice; a failed fetch
  // is removed so revisiting that person retries.
  const [people, setPeople] = useState<Record<string, Loaded>>({});
  const requested = useRef(new Set<string>());

  const load = useCallback((id: string) => {
    if (requested.current.has(id)) return;
    requested.current.add(id);
    axios.get<{ person: Person }>(`/api/person/${id}`, { headers: authHeaders })
      .then((res) => setPeople((p) => ({ ...p, [id]: { person: res.data.person } })))
      .catch((error: unknown) => {
        requested.current.delete(id);
        setPeople((p) => ({ ...p, [id]: { error } }));
      });
  }, [authHeaders]);

  // Load the person on screen, and prefetch exactly one ahead so moving on is instant.
  useEffect(() => {
    if (current) load(current.id);
    const upcoming = queue[index + 1];
    if (upcoming) load(upcoming.id);
  }, [current, queue, index, load]);

  const loaded = current ? people[current.id] : undefined;

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(undefined), 2500);
  };

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, queue.length)), [queue.length]);

  const switchCourse = (c: Course) => {
    setCourse(c);
    setIndex(0);
  };

  const decide = useCallback(async (decision: Decision) => {
    if (!current) return;
    setDecided((d) => ({ ...d, [current.id]: decision }));
    next();
    try {
      const res = await axios.post<{ written: boolean }>('/api/decision', { id: current.id, decision }, { headers: authHeaders });
      const label = decision === 'invite' ? 'Invite' : 'Don\'t invite';
      if (res.data.written) {
        flash(decision === 'invite' ? 'Invite sent' : 'Marked as don\'t invite');
      } else {
        flash(`${label} noted here only — writes are off in this environment`);
      }
    } catch (e) {
      flash(`Could not save: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [current, next, authHeaders]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const actions: Record<string, () => void> = {
        ArrowRight: () => decide('invite'),
        ArrowLeft: () => decide('not-now'),
        ArrowDown: next,
        n: () => setShowName((s) => !s),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, next]);

  if (loading) return <div className="section-body"><ProgressDots /></div>;
  if (error) return <div className="section-body"><ErrorSection error={error} /></div>;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {COURSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => switchCourse(c)}
              className={`rounded px-3 py-1 text-size-sm ${c === course ? 'bg-bluedot-navy text-on-dark' : 'bg-tint text-primary hover:bg-subtle'}`}
            >
              {c} <span className="opacity-60">{(data?.items ?? []).filter((i) => i.course === c).length}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-size-sm text-secondary">
          <span>{queue.length === 0 ? 'Nobody to review' : `${Math.min(index + 1, queue.length)} of ${queue.length}`}</span>
          <button type="button" className="underline" onClick={() => setShowName((s) => !s)}>{showName ? 'Hide name' : 'Show name'} (n)</button>
        </div>
      </div>

      {current ? (
        <>
          {!loaded && <ProgressDots />}
          {loaded && 'error' in loaded && <ErrorSection error={loaded.error} />}
          {loaded && 'person' in loaded && <PersonCard key={current.id} person={loaded.person} showName={showName} />}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-4">
            <button
              type="button"
              onClick={() => decide('not-now')}
              className="rounded border-2 border-error-fg px-4 py-2 text-size-sm font-semibold text-error-fg hover:bg-error-bg"
            >
              ← Don't invite
            </button>
            <button type="button" className="text-size-sm text-secondary underline" onClick={next}>↓ skip</button>
            <CTALinkOrButton onClick={() => decide('invite')}>Invite →</CTALinkOrButton>
          </div>
          {decided[current.id] && <p className="text-size-xs text-secondary">You already marked this person: {decided[current.id]}</p>}
        </>
      ) : (
        <div className="rounded border border-subtle p-6 text-center">
          <P>{queue.length === 0 ? 'Nobody in the queue for this course.' : `Done — you went through ${queue.length} people. ${Object.values(decided).filter((d) => d === 'invite').length} invites.`}</P>
          {queue.length > 0 && <button type="button" className="text-size-sm underline" onClick={() => setIndex(0)}>Start again</button>}
        </div>
      )}

      {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-bluedot-navy px-4 py-2 text-size-sm text-on-dark shadow">{toast}</div>}
    </div>
  );
};
