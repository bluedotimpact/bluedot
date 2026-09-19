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

// What was written to Airtable in this session, for the end-of-queue summary.
type Done = { decision: Decision; name: string; email: string; course: Course };

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
  const [done, setDone] = useState<Record<string, Done>>({});
  const [showName, setShowName] = useState(false);
  const [toast, setToast] = useState<string | undefined>();
  const [confirming, setConfirming] = useState<Decision | undefined>();
  const [writing, setWriting] = useState(false);

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
      .catch((err: unknown) => {
        requested.current.delete(id);
        setPeople((p) => ({ ...p, [id]: { error: err } }));
      });
  }, [authHeaders]);

  // Load the person on screen, and prefetch exactly one ahead so moving on is instant.
  useEffect(() => {
    if (current) load(current.id);
    const upcoming = queue[index + 1];
    if (upcoming) load(upcoming.id);
  }, [current, queue, index, load]);

  const loaded = current ? people[current.id] : undefined;
  const person = loaded && 'person' in loaded ? loaded.person : undefined;

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(undefined), 3000);
  };

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, queue.length)), [queue.length]);

  const switchCourse = (c: Course) => {
    setCourse(c);
    setIndex(0);
  };

  // Both decisions write to Airtable, so both go through the confirm dialog first.
  const ask = useCallback((decision: Decision) => {
    if (!current || !person || writing) return;
    if (done[current.id]) {
      flash('Already decided in this session');
      return;
    }

    setConfirming(decision);
  }, [current, person, writing, done]);

  const confirm = async () => {
    if (!current || !person || !confirming) return;
    const decision = confirming;
    setConfirming(undefined);
    setWriting(true);
    try {
      const res = await axios.post<{ ok: boolean; reason?: string }>('/api/decision', { id: current.id, decision }, { headers: authHeaders });
      if (res.data.ok) {
        setDone((d) => ({
          ...d, [current.id]: {
            decision, name: person.name, email: person.email, course: current.course,
          },
        }));
        flash(decision === 'invite' ? `Invite email is on its way to ${person.name}` : `${person.name} marked as don't invite`);
        next();
      } else {
        flash(res.data.reason ?? 'Could not save');
      }
    } catch (e) {
      flash(`Could not save: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setWriting(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (confirming) {
        if (e.key === 'Escape') setConfirming(undefined);
        return;
      }

      const actions: Record<string, () => void> = {
        ArrowRight: () => ask('invite'),
        ArrowLeft: () => ask('decline'),
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
  }, [ask, next, confirming]);

  if (loading) return <div className="section-body"><ProgressDots /></div>;
  if (error) return <div className="section-body"><ErrorSection error={error} /></div>;

  const invited = Object.values(done).filter((d) => d.decision === 'invite' && d.course === course);
  const declined = Object.values(done).filter((d) => d.decision === 'decline' && d.course === course);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {COURSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => switchCourse(c)}
              className={`cursor-pointer rounded px-3 py-1 text-size-sm ${c === course ? 'bg-bluedot-navy text-on-dark' : 'bg-tint text-primary hover:bg-subtle'}`}
            >
              {c} <span className="opacity-60">{(data?.items ?? []).filter((i) => i.course === c).length}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-size-sm text-secondary">
          <span>{queue.length === 0 ? 'Nobody to review' : `${Math.min(index + 1, queue.length)} of ${queue.length}`}</span>
          <button type="button" className="cursor-pointer underline" onClick={() => setShowName((s) => !s)}>{showName ? 'Hide name' : 'Show name'} (n)</button>
        </div>
      </div>

      <p className="text-size-xs text-secondary">
        Invite and Don't invite work <em>for real</em>. Use skip if you just want to look around.
      </p>

      {current ? (
        <>
          {!loaded && <ProgressDots />}
          {loaded && 'error' in loaded && <ErrorSection error={loaded.error} />}
          {person && <PersonCard key={current.id} person={person} showName={showName} />}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-4">
            <button
              type="button"
              onClick={() => ask('decline')}
              disabled={!person || writing}
              className="cursor-pointer rounded border-2 border-error-fg px-4 py-2 text-size-sm font-semibold text-error-fg hover:bg-error-bg disabled:cursor-default disabled:opacity-50"
            >
              ← Don't invite
            </button>
            <button type="button" className="cursor-pointer text-size-sm text-secondary underline" onClick={next}>↓ skip</button>
            <CTALinkOrButton onClick={() => ask('invite')} disabled={!person || writing}>Invite →</CTALinkOrButton>
          </div>
          {done[current.id]?.decision && <p className="text-size-xs text-secondary">Already decided in this session: {done[current.id]?.decision === 'invite' ? 'invited' : 'don\'t invite'}.</p>}
        </>
      ) : (
        <div className="flex flex-col gap-4 rounded border border-subtle p-6">
          {queue.length === 0 ? <P>Nobody in the queue for this course.</P> : (
            <>
              <P>Done — you went through {queue.length} people.</P>
              <DoneList title="Invited" items={invited} />
              <DoneList title="Don't invite" items={declined} />
              <button type="button" className="self-start cursor-pointer text-size-sm underline" onClick={() => setIndex(0)}>Start again</button>
            </>
          )}
        </div>
      )}

      {confirming && person && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="flex w-full max-w-md flex-col gap-4 rounded bg-raised p-6 shadow-lg">
            <P className="font-semibold">{confirming === 'invite' ? `Invite ${person.name} to a call?` : `Mark ${person.name} as don't invite?`}</P>
            <P className="text-size-sm">
              {confirming === 'invite'
                ? 'This really writes to Airtable and emails the participant. Are you sure you want to continue?'
                : 'This really writes to Airtable and removes them from the queue. Are you sure you want to continue?'}
            </P>
            <div className="flex justify-end gap-2">
              <CTALinkOrButton variant="secondary" onClick={() => setConfirming(undefined)}>Cancel</CTALinkOrButton>
              {confirming === 'invite' ? (
                <CTALinkOrButton onClick={confirm}>Send the invite</CTALinkOrButton>
              ) : (
                <button type="button" onClick={confirm} className="cursor-pointer rounded bg-error-fg px-4 py-2 text-size-sm font-semibold text-on-dark hover:opacity-90">Mark as don't invite</button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-bluedot-navy px-4 py-2 text-size-sm text-on-dark shadow">{toast}</div>}
    </div>
  );
};

const DoneList: React.FC<{ title: string; items: Done[] }> = ({ title, items }) => {
  const [copied, setCopied] = useState(false);
  if (items.length === 0) return <P className="text-size-sm text-secondary">{title}: nobody this session.</P>;
  const text = items.map((n) => `${n.name} <${n.email}>`).join('\n');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-size-sm font-semibold">{title} ({items.length})</span>
        <button
          type="button"
          className="cursor-pointer text-size-xs underline"
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'copied' : 'copy list'}
        </button>
      </div>
      <ul className="flex flex-col gap-1 text-size-sm">
        {items.map((n) => <li key={n.email + n.name}>{n.name} <span className="text-secondary">{n.email}</span></li>)}
      </ul>
    </div>
  );
};
