import { useEffect, useState } from 'react';
import { type RatingValue, type RatedApplication, toHumanOpinion, toDecision } from '../lib/client/types';
import { authFetch } from '../lib/client/api';

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

const sendOpinion = (id: string, rating: RatingValue) => {
  authFetch('/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opinions: [{ id, opinion: toHumanOpinion(rating), decision: toDecision(rating) }],
    }),
  // eslint-disable-next-line no-console
  }).catch(console.error);
};

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  roundId, round, rated, totalMs, onReset, onReviewRound,
}) => {
  const [overrides, setOverrides] = useState<Record<string, RatingValue>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roundStats, setRoundStats] = useState<{ total: number; evaluated: number; accepted: number } | null>(null);

  useEffect(() => {
    authFetch(`/api/round-stats?round=${encodeURIComponent(roundId)}`)
      .then((r) => r.json())
      .then((data: { total: number; evaluated: number; accepted: number }) => setRoundStats(data))
      // eslint-disable-next-line no-console
      .catch(console.error);
  }, [roundId]);

  const effectiveRating = (r: RatedApplication): RatingValue => overrides[r.id] ?? r.rating;

  const handleChange = (id: string, rating: RatingValue) => {
    setOverrides((prev) => ({ ...prev, [id]: rating }));
    sendOpinion(id, rating);
    setEditingId(null);
  };

  const accepted = rated.filter((r) => toDecision(effectiveRating(r)) === 'Accept');
  const rejected = rated.filter((r) => toDecision(effectiveRating(r)) === 'Reject');

  const totalCount = roundStats?.total ?? null;
  const reviewedCount = roundStats?.evaluated ?? null;
  const acceptedCount = roundStats?.accepted ?? null;

  const totalSecs = Math.floor(totalMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const avgSecs = rated.length > 0 ? Math.round(totalSecs / rated.length) : 0;

  const renderRow = (r: RatedApplication, accent: 'green' | 'red') => {
    const rating = effectiveRating(r);
    const option = RATING_OPTIONS.find((o) => o.value === rating) ?? RATING_OPTIONS[1]!;
    const subtitle = [r.jobTitle, r.organisation].filter(Boolean).join(' · ');
    const isEditing = editingId === r.id;
    const bgColors = accent === 'green' ? 'bg-green-950 border-green-800' : 'bg-red-950 border-red-800';

    return (
      <div key={r.id} className={`border rounded-lg px-3 py-2 ${bgColors}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-size-sm font-medium text-stone-100">
              {rating === 'strong-yes' && '🔥 '}{r.name}
            </p>
            {subtitle && (
              <p className="text-size-xs text-stone-400 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditingId(isEditing ? null : r.id)}
            className="shrink-0 text-size-xs text-stone-400 hover:text-stone-200 underline underline-offset-2"
          >
            {option.humanOpinion} → {option.decision}
          </button>
        </div>
        {isEditing && (
          <div className="mt-2 flex flex-wrap gap-1">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange(r.id, opt.value)}
                className={`text-size-xs px-2 py-1 rounded border transition-colors ${
                  opt.value === rating
                    ? 'bg-stone-200 text-stone-900 border-stone-200'
                    : 'bg-stone-800 text-stone-300 border-stone-600 hover:border-stone-400'
                }`}
              >
                {opt.humanOpinion} → {opt.decision}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Session complete</h1>
        <p className="text-size-sm text-stone-400 mt-1">{round}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-size-xs text-stone-400 mb-1.5">
          <span>{reviewedCount ?? '…'} of {totalCount ?? '…'} reviewed</span>
          {totalCount && reviewedCount !== null && (
            <span>{Math.round((reviewedCount / totalCount) * 100)}%</span>
          )}
        </div>
        {/* Outer track = unreviewed, green = accepted, red = rejected */}
        <div className="w-full h-4 bg-stone-700 rounded-full overflow-hidden flex">
          {totalCount && acceptedCount !== null && reviewedCount !== null ? (
            <>
              <div className="h-full bg-green-600" style={{ width: `${(acceptedCount / totalCount) * 100}%` }} />
              <div className="h-full bg-red-700" style={{ width: `${((reviewedCount - acceptedCount) / totalCount) * 100}%` }} />
            </>
          ) : null}
        </div>
        {roundStats && totalCount && reviewedCount !== null && acceptedCount !== null && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-size-xs text-stone-400">
              <span className="inline-block size-2 rounded-sm bg-green-600" />
              Accepted ({acceptedCount})
            </span>
            <span className="flex items-center gap-1 text-size-xs text-stone-400">
              <span className="inline-block size-2 rounded-sm bg-red-700" />
              Rejected ({reviewedCount - acceptedCount})
            </span>
            <span className="flex items-center gap-1 text-size-xs text-stone-500">
              <span className="inline-block size-2 rounded-sm bg-stone-700" />
              Unreviewed ({totalCount - reviewedCount})
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
          <p className="text-2xl font-bold text-stone-100">{mins}:{String(secs).padStart(2, '0')}</p>
          <p className="text-size-xs text-stone-500 mt-1">Total time</p>
        </div>
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
          <p className="text-2xl font-bold text-stone-100">{avgSecs}s</p>
          <p className="text-size-xs text-stone-500 mt-1">Avg per app</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-size-sm font-semibold uppercase tracking-wide text-green-400 mb-3">
            Accept ({accepted.length})
          </h2>
          <div className="space-y-2">
            {accepted.map((r) => renderRow(r, 'green'))}
          </div>
        </div>
        <div>
          <h2 className="text-size-sm font-semibold uppercase tracking-wide text-red-400 mb-3">
            Reject ({rejected.length})
          </h2>
          <div className="space-y-2">
            {rejected.map((r) => renderRow(r, 'red'))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onReviewRound(roundId, round)}
          className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-size-sm bg-bluedot-normal text-white hover:bg-bluedot-darker transition-colors"
        >
          Review same round again
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-size-sm border border-stone-600 text-stone-300 hover:bg-stone-800 transition-colors"
        >
          Start new session
        </button>
      </div>
    </div>
  );
};
