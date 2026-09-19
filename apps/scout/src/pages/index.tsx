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

// Decisions live in this browser only (except "invited", which was written to Airtable),
// so a reviewer can close the tab and carry on later.
type Note = { decision: Decision; name: string; email: string; course: Course; at: string };
const NOTES_KEY = 'scout.decisions';

const readNotes = (): Record<string, Note> => {
  try {
    return JSON.parse(window.localStorage.getItem(NOTES_KEY) ?? '{}') as Record<string, Note>;
  } catch {
    return {};
  }
};

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
  const [notes, setNotes] = useState<Record<string, Note>>(() => readNotes());
  const [showName, setShowName] = useState(false);
  const [toast, setToast] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);

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

  const note = useCallback((decision: Decision) => {
    if (!current || !person) return;
    setNotes((n) => {
      const updated = {
        ...n, [current.id]: {
          decision, name: person.name, email: person.email, course: current.course, at: new Date().toISOString(),
        },
      };
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [current, person]);

  const decide = useCallback((decision: 'invite' | 'not-now') => {
    // Nothing to decide on until the card is on screen
    if (!current || !person) return;
    if (notes[current.id]?.decision === 'invited') {
      flash('Already invited for real');
      return;
    }

    note(decision);
    next();
  }, [current, person, notes, note, next]);

  const inviteForReal = async () => {
    if (!current || !person) return;
    setConfirming(false);
    try {
      const res = await axios.post<{ ok: boolean; reason?: string }>('/api/invite', { id: current.id }, { headers: authHeaders });
      if (res.data.ok) {
        note('invited');
        flash(`Invite email is on its way to ${person.name}`);
        next();
      } else {
        flash(res.data.reason ?? 'Could not invite');
      }
    } catch (e) {
      flash(`Could not invite: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirming) return;
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
  }, [decide, next, confirming]);

  if (loading) return <div className="section-body"><ProgressDots /></div>;
  if (error) return <div className="section-body"><ErrorSection error={error} /></div>;

  const wouldInvite = Object.entries(notes).filter(([, n]) => n.decision === 'invite' && n.course === course);
  const invited = Object.entries(notes).filter(([, n]) => n.decision === 'invited' && n.course === course);
  const currentNote = current ? notes[current.id] : undefined;
  const noteLabel: Record<Decision, string> = { invite: 'you\'d invite', 'not-now': 'don\'t invite', invited: 'invited for real' };

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
        Invite and Don't invite are dummy. Only <strong>Invite for real</strong> writes to Airtable and sends the email.
      </p>

      {current ? (
        <>
          {!loaded && <ProgressDots />}
          {loaded && 'error' in loaded && <ErrorSection error={loaded.error} />}
          {person && <PersonCard key={current.id} person={person} showName={showName} />}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-4">
            <button
              type="button"
              onClick={() => decide('not-now')}
              className="cursor-pointer rounded border-2 border-error-fg px-4 py-2 text-size-sm font-semibold text-error-fg hover:bg-error-bg"
            >
              ← Don't invite
            </button>
            <button type="button" className="cursor-pointer text-size-sm text-secondary underline" onClick={next}>↓ skip</button>
            <div className="flex items-center gap-2">
              <CTALinkOrButton variant="secondary" onClick={() => setConfirming(true)} disabled={!person || currentNote?.decision === 'invited'}>Invite for real</CTALinkOrButton>
              <CTALinkOrButton onClick={() => decide('invite')}>Invite →</CTALinkOrButton>
            </div>
          </div>
          {currentNote && <p className="text-size-xs text-secondary">Your note on this person: {noteLabel[currentNote.decision]}.</p>}
        </>
      ) : (
        <div className="flex flex-col gap-4 rounded border border-subtle p-6">
          {queue.length === 0 ? <P>Nobody in the queue for this course.</P> : (
            <>
              <P>Done — you went through {queue.length} people.</P>
              <NoteList title="You'd invite" notes={wouldInvite} />
              <NoteList title="Invited for real" notes={invited} />
              <button type="button" className="self-start cursor-pointer text-size-sm underline" onClick={() => setIndex(0)}>Start again</button>
            </>
          )}
        </div>
      )}

      {confirming && person && current && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="flex w-full max-w-md flex-col gap-4 rounded bg-raised p-6 shadow-lg">
            <P className="font-semibold">Invite {person.name} to an evaluation call?</P>
            <P className="text-size-sm">This really writes to Airtable and emails the participant. Are you sure you want to continue?</P>
            <div className="flex justify-end gap-2">
              <CTALinkOrButton variant="secondary" onClick={() => setConfirming(false)}>Cancel</CTALinkOrButton>
              <CTALinkOrButton onClick={inviteForReal}>Send the invite</CTALinkOrButton>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-bluedot-navy px-4 py-2 text-size-sm text-on-dark shadow">{toast}</div>}
    </div>
  );
};

const NoteList: React.FC<{ title: string; notes: [string, Note][] }> = ({ title, notes }) => {
  const [copied, setCopied] = useState(false);
  if (notes.length === 0) return <P className="text-size-sm text-secondary">{title}: nobody yet.</P>;
  const text = notes.map(([, n]) => `${n.name} <${n.email}>`).join('\n');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-size-sm font-semibold">{title} ({notes.length})</span>
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
        {notes.map(([id, n]) => <li key={id}>{n.name} <span className="text-secondary">{n.email}</span></li>)}
      </ul>
    </div>
  );
};
