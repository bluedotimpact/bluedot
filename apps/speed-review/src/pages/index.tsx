import {
  useCallback, useEffect, useReducer, useRef, useState,
} from 'react';
import useAxios from 'axios-hooks';
import { ProgressDots, withAuth } from '@bluedot/ui';
import {
  type Application, type RatedApplication, type RatingValue, toHumanOpinion, toDecision,
} from '../lib/client/types';
import { type Round } from '../lib/api/airtable';
import { ApplicationCard } from '../components/ApplicationCard';
import { SwipeableRatingArea } from '../components/SwipeableRatingArea';
import { CountdownTimer, type CountdownTimerHandle } from '../components/CountdownTimer';
import { SessionComplete } from '../components/SessionComplete';
import { RoundPicker } from '../components/RoundPicker';
import { MoveToAgiscControl } from '../components/MoveToAgiscControl';
import { authFetch } from '../lib/client/api';

const COUNTDOWN_MS = 30_000;
// Fetch next batch when queue drops to this many remaining
const PREFETCH_THRESHOLD = 10;

const MILESTONE_MESSAGES: Record<number, string> = {
  20: '🔥 20 reviewed — found your rhythm.',
  30: '⚡ 30! Faster than most.',
  40: '🎯 40 — you\'re a machine (the good kind).',
  50: '💪 Halfway to 100. No stopping now.',
  60: '🚀 60 deep. Applications fear you.',
  80: '👑 80 done. This is elite territory.',
  100: '💯 ONE HUNDRED. Absolute legend.',
  120: '🤯 120?! Take a break... or don\'t.',
  150: '🏆 150. You might need professional help (in a good way).',
};

// ── State machine ──────────────────────────────────────────────────────────

type SessionState =
  | { status: 'picking-round' }
  | { status: 'loading'; roundId: string; roundName: string; course: string }
  | { status: 'reviewing'; roundId: string; roundName: string; course: string; queue: Application[]; seen: RatedApplication[]; timerPaused: boolean; startMs: number; nextOffset?: string }
  | { status: 'complete'; roundId: string; roundName: string; course: string; rated: RatedApplication[]; totalMs: number; totalLoaded: number };

type Action =
  | { type: 'ROUND_SELECTED'; round: Round }
  | { type: 'LOADED'; applications: Application[]; nextOffset?: string }
  | { type: 'MORE_LOADED'; applications: Application[]; nextOffset?: string }
  | { type: 'RATE'; rating: RatingValue }
  | { type: 'TIMEOUT' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'CONCLUDE' }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'MOVE_TO_AGISC'; roundName: string };

const reduce = (state: SessionState, action: Action): SessionState => {
  if (action.type === 'RESET') {
    return { status: 'picking-round' };
  }

  if (action.type === 'ROUND_SELECTED') {
    return {
      status: 'loading',
      roundId: action.round.id,
      roundName: action.round.name,
      course: action.round.name.split('(')[0]?.trim() ?? '',
    };
  }

  if (action.type === 'LOADED' && state.status === 'loading') {
    if (action.applications.length === 0) {
      return {
        status: 'complete', roundId: state.roundId, roundName: state.roundName, course: state.course, rated: [], totalMs: 0, totalLoaded: 0,
      };
    }

    return {
      status: 'reviewing',
      roundId: state.roundId,
      roundName: state.roundName,
      course: state.course,
      queue: action.applications,
      seen: [],
      timerPaused: false,
      startMs: Date.now(),
      nextOffset: action.nextOffset,
    };
  }

  if (action.type === 'MORE_LOADED' && state.status === 'reviewing') {
    // Dedupe against seen and queue: Airtable pagination can return the same
    // record across pages when the filtered-on field is modified mid-iteration,
    // which happens constantly here because every rating mutates the Decision
    // field the formula filters on.
    const known = new Set<string>([
      ...state.seen.map((a) => a.id),
      ...state.queue.map((a) => a.id),
    ]);
    const fresh = (action.applications ?? []).filter((a) => !known.has(a.id));
    return {
      ...state,
      queue: [...state.queue, ...fresh],
      nextOffset: action.nextOffset,
    };
  }

  if (state.status !== 'reviewing') return state;

  if (action.type === 'CONCLUDE') {
    return {
      status: 'complete',
      roundId: state.roundId,
      roundName: state.roundName,
      course: state.course,
      rated: state.seen,
      totalMs: Date.now() - state.startMs,
      totalLoaded: state.seen.length + state.queue.length,
    };
  }

  const [current, ...rest] = state.queue;
  if (!current) return state;

  if (action.type === 'TOGGLE_PAUSE') {
    return { ...state, timerPaused: !state.timerPaused };
  }

  if (action.type === 'UNDO') {
    const lastSeen = state.seen[state.seen.length - 1];
    if (!lastSeen) return state;
    return {
      ...state,
      queue: [lastSeen, ...state.queue],
      seen: state.seen.slice(0, -1),
    };
  }

  if (action.type === 'TIMEOUT') {
    return { ...state, queue: [...rest, current] };
  }

  if (action.type === 'MOVE_TO_AGISC') {
    const moved: RatedApplication = { ...current, rating: 'moved-to-agisc', movedToRound: action.roundName };
    const newSeen = [...state.seen, moved];
    if (rest.length === 0 && !state.nextOffset) {
      return {
        status: 'complete',
        roundId: state.roundId,
        roundName: state.roundName,
        course: state.course,
        rated: newSeen,
        totalMs: Date.now() - state.startMs,
        totalLoaded: newSeen.length,
      };
    }

    return { ...state, queue: rest, seen: newSeen };
  }

  if (action.type === 'RATE') {
    const rated: RatedApplication = { ...current, rating: action.rating };
    const newSeen = [...state.seen, rated];
    if (rest.length === 0 && !state.nextOffset) {
      return {
        status: 'complete',
        roundId: state.roundId,
        roundName: state.roundName,
        course: state.course,
        rated: newSeen,
        totalMs: Date.now() - state.startMs,
        totalLoaded: newSeen.length,
      };
    }

    return { ...state, queue: rest, seen: newSeen };
  }

  return state;
};

// ── Initial loader ─────────────────────────────────────────────────────────

type ApplicationLoaderProps = {
  round: string;
  onLoaded: (applications: Application[], nextOffset?: string) => void;
  onError: (err: Error) => void;
};

const ApplicationLoader: React.FC<ApplicationLoaderProps> = ({ round, onLoaded, onError }) => {
  const [{ data, loading, error }] = useAxios<{ applications: Application[]; nextOffset?: string }>({
    method: 'get',
    url: `/api/applications?round=${encodeURIComponent(round)}`,
  }, { useCache: false });

  useEffect(() => {
    if (data) onLoaded(data.applications, data.nextOffset);
  }, [data, onLoaded]);

  useEffect(() => {
    if (error) onError(error);
  }, [error, onError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <ProgressDots />
      </div>
    );
  }

  return null;
};

// ── Main component ─────────────────────────────────────────────────────────

const SpeedReviewPage = (_props: { auth: unknown; setAuth: unknown }) => {
  const [state, dispatch] = useReducer(reduce, { status: 'picking-round' });
  const [toastName, setToastName] = useState<string | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMilestoneRef = useRef(0);
  const timerKeyRef = useRef(0);
  const prevCurrentIdRef = useRef<string | null>(null);
  const fetchingMoreRef = useRef(false);
  const timerRef = useRef<CountdownTimerHandle>(null);
  const handleRateRef = useRef<(rating: RatingValue) => void>(() => {});

  const handleLoaded = useCallback((applications: Application[], nextOffset?: string) => {
    dispatch({ type: 'LOADED', applications, nextOffset });
  }, []);

  const handleLoadError = useCallback((err: Error) => {
    // eslint-disable-next-line no-console
    console.error(err);
    dispatch({ type: 'RESET' });
  }, []);

  const showMilestone = useCallback((count: number) => {
    if (count === 0 || !MILESTONE_MESSAGES[count] || count === lastMilestoneRef.current) return;
    lastMilestoneRef.current = count;
    const message = MILESTONE_MESSAGES[count] ?? `${count} reviewed! Keep going!`;
    setMilestoneToast(message);
    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
    milestoneTimerRef.current = setTimeout(() => setMilestoneToast(null), 6000);
  }, []);

  const handleRate = useCallback((rating: RatingValue) => {
    if (state.status !== 'reviewing') return;
    const [current] = state.queue;
    if (!current) return;

    authFetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opinions: [{ id: current.id, opinion: toHumanOpinion(rating), decision: toDecision(rating) }],
      }),
    }).then((r) => {
      if (!r.ok) {
        return r.text().then((t) => {
          throw new Error(`${r.status}: ${t}`);
        });
      }

      setSaveError(null);
    }).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(err);
      setSaveError(`Failed to save rating for ${current.name} — ${err instanceof Error ? err.message : String(err)}`);
    });

    showMilestone(state.seen.length + 1);
    dispatch({ type: 'RATE', rating });

    // Show undo toast
    setUndoToast(current.name);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 6000);
  }, [state, showMilestone]);
  handleRateRef.current = handleRate;

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const handleTimeout = useCallback(() => {
    if (state.status !== 'reviewing') return;
    const [current] = state.queue;
    if (!current) return;
    const { name } = current;
    dispatch({ type: 'TIMEOUT' });
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setToastName(name);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastName(null), 3000);
  }, [state]);

  // Background prefetch: trigger when queue is running low
  const queueLength = state.status === 'reviewing' ? state.queue.length : 0;
  const nextOffset = state.status === 'reviewing' ? state.nextOffset : undefined;
  const roundId = state.status === 'reviewing' ? state.roundId : undefined;

  useEffect(() => {
    if (state.status !== 'reviewing') return;
    if (!nextOffset || !roundId) return;
    if (queueLength > PREFETCH_THRESHOLD) return;
    if (fetchingMoreRef.current) return;

    fetchingMoreRef.current = true;

    authFetch(`/api/applications?round=${encodeURIComponent(roundId)}&offset=${encodeURIComponent(nextOffset)}`)
      .then((r) => r.json())
      .then((data: { applications: Application[]; nextOffset?: string; error?: unknown }) => {
        if (data.error) {
          // Offset expired (LIST_RECORDS_ITERATOR_NOT_AVAILABLE) — stop paginating
          dispatch({ type: 'MORE_LOADED', applications: [], nextOffset: undefined });
          return;
        }

        dispatch({ type: 'MORE_LOADED', applications: Array.isArray(data.applications) ? data.applications : [], nextOffset: data.nextOffset });
      })
      // eslint-disable-next-line no-console
      .catch(console.error)
      .finally(() => {
        fetchingMoreRef.current = false;
      });
  }, [state.status, queueLength, nextOffset, roundId]);

  // Keyboard shortcuts
  useEffect(() => {
    if (state.status !== 'reviewing') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleRateRef.current('no');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleRateRef.current('neutral-accept');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleRateRef.current('neutral-reject');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleRateRef.current('yes');
          break;
        case 'e':
        case 'E':
          handleRateRef.current('strong-yes');
          break;
        case ' ': {
          e.preventDefault();
          const details = Array.from(document.querySelectorAll('details'));
          const openIndex = details.findIndex((d) => d.open);
          details.forEach((d) => {
            d.open = false;
          });
          const nextIndex = openIndex === -1 ? 0 : openIndex + 1;

          if (nextIndex < details.length) {
            details[nextIndex]!.open = true;
            details[nextIndex]!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          break;
        }

        case 'p':
        case 'P':
          dispatch({ type: 'TOGGLE_PAUSE' });
          break;
        case 'Escape':
          dispatch({ type: 'CONCLUDE' });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.status]);

  // ── Round picker ──────────────────────────────────────────────────────────

  if (state.status === 'picking-round') {
    return <RoundPicker onSelect={(round) => dispatch({ type: 'ROUND_SELECTED', round })} />;
  }

  // ── Loading applications ──────────────────────────────────────────────────

  if (state.status === 'loading') {
    return (
      <ApplicationLoader
        round={state.roundId}
        onLoaded={handleLoaded}
        onError={handleLoadError}
      />
    );
  }

  // ── Session complete ──────────────────────────────────────────────────────

  if (state.status === 'complete') {
    return (
      <div className="min-h-screen bg-stone-950 py-6 sm:py-12 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto bg-stone-900 rounded-xl shadow-sm border border-stone-700 p-4 sm:p-8">
          <SessionComplete
            roundId={state.roundId}
            round={state.roundName}
            rated={state.rated}
            totalMs={state.totalMs}
            onReset={() => dispatch({ type: 'RESET' })}
            onReviewRound={(roundId, roundName) => dispatch({ type: 'ROUND_SELECTED', round: { id: roundId, name: roundName, course: state.course } })}
          />
        </div>
      </div>
    );
  }

  // ── Save error — block all further reviewing ───────────────────────────────

  if (saveError) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
        <div className="bg-stone-900 rounded-xl border border-red-800 p-4 sm:p-8 max-w-md w-full space-y-4">
          <h1 className="text-size-xl font-bold text-red-400">Save failed</h1>
          <p className="text-size-sm text-stone-300">
            Your last rating didn&apos;t save to Airtable. Continuing would mean your reviews are lost.
          </p>
          <p className="text-size-xs text-stone-500 font-mono break-all">{saveError}</p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-size-sm border border-stone-600 text-stone-300 hover:bg-stone-800 transition-colors"
            >
              Dismiss and continue anyway
            </button>
            <button
              type="button"
              onClick={() => {
                setSaveError(null);
                dispatch({ type: 'RESET' });
              }}
              className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-size-sm bg-red-900 border border-red-700 text-red-200 hover:bg-red-800 transition-colors"
            >
              Stop reviewing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Reviewing ─────────────────────────────────────────────────────────────

  const [current] = state.queue;
  if (!current) return null;

  if (prevCurrentIdRef.current !== current.id) {
    prevCurrentIdRef.current = current.id;
    timerKeyRef.current += 1;
    window.scrollTo({ top: 0 });
  }

  const totalApps = state.queue.length + state.seen.length;

  return (
    <div className="min-h-screen bg-stone-950 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-stone-900 rounded-xl border border-stone-700 px-5 py-3 flex items-center gap-4">
          <div className="flex-1">
            <CountdownTimer
              ref={timerRef}
              key={timerKeyRef.current}
              durationMs={COUNTDOWN_MS}
              paused={state.timerPaused}
              onExpire={handleTimeout}
              onTogglePause={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              startMs={state.startMs}
            />
          </div>
          <span className="font-mono text-size-xs text-stone-600 shrink-0">
            {state.seen.length}
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: 'CONCLUDE' })}
            className="text-stone-500 hover:text-stone-300 transition-colors shrink-0"
            title="Conclude session (Esc)"
            aria-label="Conclude session"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-stone-900 rounded-xl border border-stone-700 p-4 sm:p-6">
          <ApplicationCard
            key={current.id}
            application={current}
            position={state.seen.length + 1}
            total={totalApps}
            onProfileOpen={() => timerRef.current?.addTime(10_000)}
            course={state.course}
          />
        </div>

        <div className="bg-stone-900 rounded-xl border border-stone-700 p-4">
          <SwipeableRatingArea onRate={handleRate} />
        </div>

        {state.course === 'Technical AI Safety' && (
          <div className="bg-stone-900 rounded-xl border border-stone-700 p-4">
            <MoveToAgiscControl
              applicationId={current.id}
              allowMoveToAgisc={current.allowMoveToAgisc ?? false}
              onMoved={(roundName) => dispatch({ type: 'MOVE_TO_AGISC', roundName })}
            />
          </div>
        )}
      </div>

      {milestoneToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-bluedot-normal text-white text-size-sm px-5 py-2.5 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
          {milestoneToast}
        </div>
      )}

      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-size-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-3 z-20">
          <span>Rated {undoToast}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-semibold text-bluedot-normal hover:text-bluedot-lighter underline underline-offset-2"
          >
            Re-rate
          </button>
        </div>
      )}

      {toastName && (
        <div className={`fixed left-1/2 -translate-x-1/2 bg-stone-800 text-white text-size-sm px-4 py-2 rounded-full shadow-lg pointer-events-none ${undoToast ? 'bottom-16' : 'bottom-6'}`}>
          Moved to back of queue: {toastName}
        </div>
      )}
    </div>
  );
};

export default withAuth(SpeedReviewPage);
