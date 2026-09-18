import {
  useCallback, useEffect, useMemo, useState,
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

  const [{ data: personData, loading: personLoading, error: personError }] = useAxios<{ person: Person }>(
    { url: `/api/person/${current?.id ?? ''}`, headers: authHeaders },
    { manual: !current },
  );

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(undefined), 2500);
  };

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, queue.length)), [queue.length]);
  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const decide = useCallback(async (decision: Decision) => {
    if (!current) return;
    setDecided((d) => ({ ...d, [current.id]: decision }));
    next();
    try {
      const res = await axios.post<{ written: boolean }>('/api/decision', { id: current.id, decision }, { headers: authHeaders });
      const label = decision === 'invite' ? 'Invite' : 'Not now';
      if (res.data.written) {
        flash(decision === 'invite' ? 'Invite sent' : 'Marked not now');
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
        ArrowUp: back,
        n: () => setShowName((s) => !s),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [decide, next, back]);

  useEffect(() => {
    setIndex(0);
  }, [course]);

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
              onClick={() => setCourse(c)}
              className={`rounded px-3 py-1 text-sm ${c === course ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {c} <span className="opacity-60">{(data?.items ?? []).filter((i) => i.course === c).length}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-size-sm text-gray-600">
          <span>{queue.length === 0 ? 'Nobody to review' : `${Math.min(index + 1, queue.length)} of ${queue.length}`}</span>
          <button type="button" className="underline" onClick={() => setShowName((s) => !s)}>{showName ? 'Hide name' : 'Show name'} (n)</button>
        </div>
      </div>

      {current ? (
        <>
          {personLoading && <ProgressDots />}
          {personError && <ErrorSection error={personError} />}
          {personData?.person?.id === current.id && <PersonCard person={personData.person} showName={showName} />}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4">
            <CTALinkOrButton variant="secondary" onClick={() => decide('not-now')}>← Not now</CTALinkOrButton>
            <div className="flex gap-2 text-size-sm text-gray-500">
              <button type="button" className="underline" onClick={back}>↑ back</button>
              <button type="button" className="underline" onClick={next}>↓ skip</button>
            </div>
            <CTALinkOrButton onClick={() => decide('invite')}>Invite →</CTALinkOrButton>
          </div>
          {decided[current.id] && <p className="text-size-xs text-gray-500">You already marked this person: {decided[current.id]}</p>}
        </>
      ) : (
        <div className="rounded border border-gray-200 p-6 text-center">
          <P>{queue.length === 0 ? 'Nobody in the queue for this course.' : `Done — you went through ${queue.length} people. ${Object.values(decided).filter((d) => d === 'invite').length} invites.`}</P>
          {queue.length > 0 && <button type="button" className="text-size-sm underline" onClick={() => setIndex(0)}>Start again</button>}
        </div>
      )}

      {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-black px-4 py-2 text-size-sm text-white shadow">{toast}</div>}
    </div>
  );
};
