import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { H1, H2 } from '@bluedot/ui';
import {
  type RatingValue, type RatedApplication, toHumanOpinion, toDecision,
} from '../lib/client/types';
import { authFetch } from '../lib/client/api';
import { useNavigationState } from '../lib/client/navigation';

type SessionCompleteProps = {
  roundId: string;
  round: string;
  rated: RatedApplication[];
  totalMs: number;
  onReset: () => void;
  onReviewRound: (roundId: string, roundName: string) => void;
};

const RATING_OPTIONS: { value: RatingValue; humanOpinion: string; decision: string }[] = [
  { value: 'strong-yes', humanOpinion: 'Strong yes', decision: 'Accept' },
  { value: 'yes', humanOpinion: 'Weak yes', decision: 'Accept' },
  { value: 'neutral-accept', humanOpinion: 'Neutral', decision: 'Accept' },
  { value: 'neutral-reject', humanOpinion: 'Neutral', decision: 'Reject' },
  { value: 'no', humanOpinion: 'Weak no', decision: 'Reject' },
];

// Strongest yes (top) → most-negative (bottom), used to sort the result lists.
const RATING_RANK: Record<RatingValue, number> = {
  'strong-yes': 0,
  yes: 1,
  'neutral-accept': 2,
  'neutral-reject': 3,
  no: 4,
  'moved-to-agisc': 5,
};

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  roundId, round, rated, totalMs, onReset, onReviewRound,
}) => {
  const pendingWrites = useNavigationState((navigation) => navigation.pendingWrites);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, RatingValue>>({});
  const [resetIds, setResetIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roundStats, setRoundStats] = useState<{ total: number; evaluated: number; accepted: number } | null>(null);
  const [confettiSize, setConfettiSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const update = () => setConfettiSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    authFetch(`/api/round-stats?round=${encodeURIComponent(roundId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((data: { total: number; evaluated: number; accepted: number }) => setRoundStats(data))
      // eslint-disable-next-line no-console
      .catch(console.error);
  }, [roundId]);

  const effectiveRating = (r: RatedApplication): RatingValue => overrides[r.id] ?? r.rating;

  const saveChange = async (id: string, rating?: RatingValue) => {
    if (useNavigationState.getState().pendingWrites > 0) return;
    setSaveError(null);
    try {
      const response = await authFetch(rating ? '/api/decisions' : '/api/reset-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating ? { opinions: [{ id, opinion: toHumanOpinion(rating), decision: toDecision(rating) }] } : { applicationId: id }),
      });
      if (!response.ok) throw new Error('This change could not be saved. Please try again.');
      if (rating) setOverrides((prev) => ({ ...prev, [id]: rating }));
      else setResetIds((prev) => new Set(prev).add(id));
      setEditingId(null);
      setRoundStats(null);
      const stats = await authFetch(`/api/round-stats?round=${encodeURIComponent(roundId)}`);
      if (stats.ok) setRoundStats(await stats.json());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'This change could not be saved.');
    }
  };

  const active = rated.filter((r) => !resetIds.has(r.id));
  const byStrength = (a: RatedApplication, b: RatedApplication) => RATING_RANK[effectiveRating(a)] - RATING_RANK[effectiveRating(b)];
  const accepted = active.filter((r) => toDecision(effectiveRating(r)) === 'Accept').sort(byStrength);
  const rejected = active.filter((r) => toDecision(effectiveRating(r)) === 'Reject').sort(byStrength);

  const totalCount = roundStats?.total ?? null;
  const reviewedCount = roundStats?.evaluated ?? null;
  const acceptedCount = roundStats?.accepted ?? null;
  const roundComplete = totalCount !== null && reviewedCount !== null && totalCount > 0 && reviewedCount >= totalCount;

  const totalSecs = Math.floor(totalMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const avgTotalSecs = rated.length > 0 ? Math.round(totalSecs / rated.length) : 0;
  const avgMins = Math.floor(avgTotalSecs / 60);
  const avgSecs = avgTotalSecs % 60;
  const avgDisplay = avgMins > 0 ? `${avgMins}m ${String(avgSecs).padStart(2, '0')}s` : `${avgSecs}s`;

  const renderRow = (r: RatedApplication, accent: 'green' | 'red') => {
    const isMoved = r.rating === 'moved-to-agisc';
    const rating = effectiveRating(r);
    const option = RATING_OPTIONS.find((o) => o.value === rating) ?? RATING_OPTIONS[1]!;
    const subtitle = [r.jobTitle, r.organisation].filter(Boolean).join(' · ');
    const isEditing = editingId === r.id;
    let bgColors = 'bg-error-bg border-error-border';
    if (isMoved) bgColors = 'bg-warning-bg border-warning-border';
    else if (accent === 'green') bgColors = 'bg-info-bg border-info-border';

    return (
      <div key={r.id} className={`border rounded-lg px-3 py-2 overflow-hidden ${bgColors}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
          <div className="min-w-0">
            <p className="text-size-sm font-medium text-primary break-words">
              {rating === 'strong-yes' && '🔥 '}{r.name}
            </p>
            {isMoved && r.movedToRound && (
              <p className="text-size-xs text-warning-fg truncate">→ Moved to {r.movedToRound}</p>
            )}
            {!isMoved && subtitle && (
              <p className="text-size-xs text-secondary truncate">{subtitle}</p>
            )}
          </div>
          {!isMoved && (
            <button
              type="button"
              disabled={pendingWrites > 0}
              onClick={() => setEditingId(isEditing ? null : r.id)}
              className="min-h-11 shrink-0 text-size-xs text-secondary hover:text-primary underline underline-offset-2"
            >
              {option.humanOpinion} → {option.decision}
            </button>
          )}
        </div>
        {isEditing && !isMoved && (
          <div className="mt-2 flex flex-wrap gap-1">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={pendingWrites > 0}
                onClick={() => saveChange(r.id, opt.value)}
                className={`min-h-11 text-size-xs px-2 py-1 rounded border transition-colors ${
                  opt.value === rating
                    ? 'bg-active text-primary border-strong'
                    : 'bg-tint text-primary border-strong hover:border-strong'
                }`}
              >
                {opt.humanOpinion} → {opt.decision}
              </button>
            ))}
            <button
              type="button"
              disabled={pendingWrites > 0}
              onClick={() => saveChange(r.id)}
              className="min-h-11 text-size-xs px-2 py-1 rounded border transition-colors bg-tint text-warning-fg border-warning-border hover:border-warning-border"
            >
              Rerate
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {saveError && <p role="alert" className="rounded-surface border border-error-border bg-error-bg p-4 text-size-sm text-error-fg">{saveError}</p>}
      {roundComplete && confettiSize && (
        <Confetti
          recycle={false}
          numberOfPieces={500}
          width={confettiSize.width}
          height={confettiSize.height}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}
      <div>
        <H1 className="text-size-lg text-primary">{(() => {
          if (roundComplete) return 'You\'ve evaluated all the applications for the round!';
          if (rated.length === 0) return 'No scored applications available';
          return 'Session complete';
        })()}
        </H1>
        <p className="text-size-sm text-secondary mt-1">{round}</p>
        {!roundComplete && rated.length === 0 && (
          <p className="text-size-sm text-secondary mt-2">
            The scoring pipeline may still be running for this round. Try again later, or pick a different round.
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-size-xs text-secondary mb-1.5">
          <span>{reviewedCount ?? '…'} of {totalCount ?? '…'} reviewed</span>
          {totalCount && reviewedCount !== null && (
            <span>{Math.round((reviewedCount / totalCount) * 100)}%</span>
          )}
        </div>
        {/* Outer track = unreviewed, green = accepted, red = rejected */}
        <div className="w-full h-4 bg-active rounded-full overflow-hidden flex">
          {totalCount && acceptedCount !== null && reviewedCount !== null ? (
            <>
              <div className="h-full bg-accent" style={{ width: `${(acceptedCount / totalCount) * 100}%` }} />
              <div className="h-full bg-red-700" style={{ width: `${((reviewedCount - acceptedCount) / totalCount) * 100}%` }} />
            </>
          ) : null}
        </div>
        {roundStats && totalCount && reviewedCount !== null && acceptedCount !== null && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-size-xs text-secondary">
              <span className="inline-block size-2 rounded-sm bg-accent" />
              Accepted ({acceptedCount})
            </span>
            <span className="flex items-center gap-1 text-size-xs text-secondary">
              <span className="inline-block size-2 rounded-sm bg-red-700" />
              Rejected ({reviewedCount - acceptedCount})
            </span>
            <span className="flex items-center gap-1 text-size-xs text-secondary">
              <span className="inline-block size-2 rounded-sm bg-active" />
              Unreviewed ({totalCount - reviewedCount})
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
        <div className="bg-tint border border-subtle rounded-lg p-4">
          <p className="text-2xl font-bold text-primary">{mins}:{String(secs).padStart(2, '0')}</p>
          <p className="text-size-xs text-secondary mt-1">Total time</p>
        </div>
        <div className="bg-tint border border-subtle rounded-lg p-4">
          <p className="text-2xl font-bold text-primary">{avgDisplay}</p>
          <p className="text-size-xs text-secondary mt-1">Avg per app</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="min-w-0">
          <H2 className="text-size-sm uppercase tracking-wide text-info-fg mb-3">
            Accept ({accepted.length})
          </H2>
          <div className="space-y-2">
            {accepted.map((r) => renderRow(r, 'green'))}
          </div>
        </div>
        <div className="min-w-0">
          <H2 className="text-size-sm uppercase tracking-wide text-error-fg mb-3">
            Reject ({rejected.length})
          </H2>
          <div className="space-y-2">
            {rejected.map((r) => renderRow(r, 'red'))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={pendingWrites > 0}
          onClick={() => onReviewRound(roundId, round)}
          className="min-h-11 flex-1 py-2.5 px-4 rounded-lg font-semibold text-size-sm bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          Review same round again
        </button>
        <button
          type="button"
          disabled={pendingWrites > 0}
          onClick={onReset}
          className="min-h-11 flex-1 py-2.5 px-4 rounded-lg font-semibold text-size-sm border border-strong text-primary hover:bg-tint transition-colors"
        >
          Review a different round
        </button>
      </div>
    </div>
  );
};
