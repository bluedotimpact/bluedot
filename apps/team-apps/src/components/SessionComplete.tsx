import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import {
  Callout, H1, H2, Modal,
} from '@bluedot/ui';
import {
  type RatingValue, type RatedApplication, toHumanOpinion, toDecision,
} from '../lib/client/types';
import { type DecisionEmailCounts } from '../lib/api/airtable';
import { authFetch } from '../lib/client/api';
import { useNavigationState } from '../lib/client/navigation';

type SessionCompleteProps = {
  roundId: string;
  round: string;
  // The reviewed round's course, restored when a move is undone.
  course: string;
  rated: RatedApplication[];
  totalMs: number;
  // How many applications the session had available, distinguishing "you
  // rated none" from "the round had none to review".
  totalLoaded: number;
  // Round stats and email counts always cover the whole round, so a filtered
  // session labels them as such.
  filtered: boolean;
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
  moved: 5,
};

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  roundId, round, course, rated, totalMs, totalLoaded, filtered, onReset, onReviewRound,
}) => {
  const pendingWrites = useNavigationState((navigation) => navigation.pendingWrites);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, RatingValue>>({});
  const [resetIds, setResetIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roundStats, setRoundStats] = useState<{ total: number; evaluated: number; accepted: number } | null>(null);
  const [emailCounts, setEmailCounts] = useState<DecisionEmailCounts | null>(null);
  const [countsError, setCountsError] = useState(false);
  const [confirmingScope, setConfirmingScope] = useState<'session' | 'round' | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  // Live progress of the last send. Queueing = the browser is still writing
  // send flags (progress: the round's pending count dropping), so the page
  // must stay open. Sending = flags are written and the Airtable automation
  // confirms them; progress is the flagged-but-unconfirmed queue draining to
  // zero, so confirmations from earlier sends can never complete it early.
  const [sendTracker, setSendTracker] = useState<
    | { phase: 'queueing'; expected: number; pendingAtStart: number | null }
    | { phase: 'sending'; flagged: number; total: number }
    | null
  >(null);
  // Applications already flagged from this summary; excluded from the session
  // button so its count matches what another send would actually do.
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  // Consecutive polls that brought no data (expired login, Airtable busy) —
  // surfaced so a frozen number is never mistaken for live progress.
  const [stalePolls, setStalePolls] = useState(0);
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

  useEffect(() => {
    authFetch(`/api/decision-email-counts?round=${encodeURIComponent(roundId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((data: DecisionEmailCounts) => {
        setEmailCounts(data);
        // A queue left over from an earlier visit (the tracker doesn't survive
        // a reload) still deserves a live tracker.
        const queue = Math.max(0, data.alreadySent - data.confirmedSent);
        if (queue > 0) setSendTracker((prev) => prev ?? { phase: 'sending', flagged: queue, total: queue });
      })
      .catch(() => setCountsError(true));
  }, [roundId]);

  const trackerRemaining = emailCounts ? Math.max(0, emailCounts.alreadySent - emailCounts.confirmedSent) : null;
  const trackerDone = sendTracker?.phase === 'sending' && trackerRemaining === 0;
  const trackerConfirmed = sendTracker?.phase === 'sending' && trackerRemaining !== null
    ? Math.min(sendTracker.total, Math.max(0, sendTracker.total - trackerRemaining))
    : 0;
  const trackerQueued = sendTracker?.phase === 'queueing' && sendTracker.pendingAtStart !== null && emailCounts
    ? Math.min(sendTracker.expected, Math.max(0, sendTracker.pendingAtStart - emailCounts.pending))
    : 0;

  // While a send is confirming, poll the counts so the tracker advances.
  useEffect(() => {
    if (!sendTracker || trackerDone) return undefined;
    const poll = setInterval(() => {
      authFetch(`/api/decision-email-counts?round=${encodeURIComponent(roundId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: DecisionEmailCounts | null) => {
          if (data) {
            setEmailCounts(data);
            setStalePolls(0);
          } else {
            setStalePolls((n) => n + 1);
          }
        })
        .catch(() => setStalePolls((n) => n + 1));
    }, 5000);
    return () => clearInterval(poll);
  }, [sendTracker, trackerDone, roundId]);

  const effectiveRating = (r: RatedApplication): RatingValue => overrides[r.id] ?? r.rating;

  const refreshEmailCounts = async (): Promise<DecisionEmailCounts | null> => {
    try {
      const counts = await authFetch(`/api/decision-email-counts?round=${encodeURIComponent(roundId)}`);
      if (counts.ok) {
        const data = await counts.json() as DecisionEmailCounts;
        setEmailCounts(data);
        setCountsError(false);
        return data;
      }
    } catch {
      // Fall through to the error flag below.
    }

    // With previous counts on screen this flag is invisible; without any it
    // swaps the loading text for a retry.
    setCountsError(true);
    return null;
  };

  // Stats are decorative here — a failed refresh must not read as a failed save.
  const refreshStats = async () => {
    setRoundStats(null);
    try {
      const stats = await authFetch(`/api/round-stats?round=${encodeURIComponent(roundId)}`);
      if (stats.ok) setRoundStats(await stats.json());
    } catch {
      // Leave the progress bar in its loading state.
    }

    await refreshEmailCounts();
  };

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
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'This change could not be saved.');
      return;
    }

    await refreshStats();
  };

  // Returns a moved application to this round; it comes back unrated, so the
  // row disappears from the results like a rerated one.
  const undoMove = async (id: string) => {
    if (useNavigationState.getState().pendingWrites > 0) return;
    setSaveError(null);
    try {
      const response = await authFetch('/api/undo-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, roundId, restoreCourse: course }),
      });
      if (!response.ok) throw new Error('This change could not be saved. Please try again.');
      setResetIds((prev) => new Set(prev).add(id));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'This change could not be saved.');
      return;
    }

    await refreshStats();
  };

  const active = rated.filter((r) => !resetIds.has(r.id));
  const byStrength = (a: RatedApplication, b: RatedApplication) => RATING_RANK[effectiveRating(a)] - RATING_RANK[effectiveRating(b)];
  const accepted = active.filter((r) => toDecision(effectiveRating(r)) === 'Accept').sort(byStrength);
  const rejected = active.filter((r) => toDecision(effectiveRating(r)) === 'Reject').sort(byStrength);

  // Applications moved to another course left this round, so their decision
  // emails are not this round's to send.
  const sessionEmailApps = active.filter((r) => effectiveRating(r) !== 'moved' && !flaggedIds.has(r.id));
  const sessionEmailIds = sessionEmailApps.map((r) => r.id);
  const confirmAccepted = confirmingScope === 'session'
    ? sessionEmailApps.filter((r) => toDecision(effectiveRating(r)) === 'Accept').length
    : emailCounts?.pendingAccepted ?? 0;
  const confirmRejected = confirmingScope === 'session'
    ? sessionEmailApps.filter((r) => toDecision(effectiveRating(r)) === 'Reject').length
    : emailCounts?.pendingRejected ?? 0;
  const confirmCount = confirmAccepted + confirmRejected;

  const closeConfirm = () => {
    setConfirmingScope(null);
    setEmailNotice(null);
  };

  const sendDecisionEmails = async (scope: 'session' | 'round') => {
    if (useNavigationState.getState().pendingWrites > 0) return;
    setEmailNotice(null);
    // Flagging a large batch takes a while (the request writes in paced
    // ten-record batches), so close the modal and show queueing progress
    // immediately instead of leaving the buttons silently greyed out.
    const expected = scope === 'round' ? emailCounts?.pending ?? 0 : sessionEmailIds.length;
    // Progress needs the round's pending count from before the send; without
    // it the queueing display stays numberless rather than guessing.
    const pendingAtStart = emailCounts?.pending ?? null;
    setConfirmingScope(null);
    setSendTracker({ phase: 'queueing', expected, pendingAtStart });
    try {
      const response = await authFetch('/api/send-decision-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scope === 'session' ? { roundId, applicationIds: sessionEmailIds } : { roundId }),
      });
      if (!response.ok) throw new Error('The decision emails could not be triggered. Please try again.');
      const { flagged } = await response.json() as { flagged: number };
      // A round send covers the session's applications too: anything pending
      // was just flagged, anything else was already sent or sending.
      setFlaggedIds((prev) => new Set([...prev, ...sessionEmailIds]));
      const fresh = await refreshEmailCounts();
      // Without post-send counts the queue size is unknown; clearing forces
      // the tracker to wait for the next successful poll instead of judging
      // done-ness from pre-send numbers.
      if (!fresh) setEmailCounts(null);
      const queued = fresh ? Math.max(0, fresh.alreadySent - fresh.confirmedSent) : flagged;
      setSendTracker({ phase: 'sending', flagged, total: queued });
    } catch (error) {
      setSendTracker(null);
      setEmailNotice(error instanceof Error ? error.message : 'The decision emails could not be triggered.');
    }
  };

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
    const isMoved = r.rating === 'moved';
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
          {isMoved ? (
            <button
              type="button"
              disabled={pendingWrites > 0}
              onClick={() => undoMove(r.id)}
              className="min-h-11 shrink-0 text-size-xs text-warning-fg hover:text-primary underline underline-offset-2 disabled:opacity-40"
            >
              Undo move
            </button>
          ) : (
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
      {saveError && <Callout tone="error" role="alert">{saveError}</Callout>}
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
          if (rated.length === 0 && totalLoaded === 0) return filtered ? 'No matching applications' : 'No scored applications available';
          if (rated.length === 0) return 'You haven\'t reviewed any applications';
          return 'Session complete';
        })()}
        </H1>
        <p className="text-size-sm text-secondary mt-1">{round}</p>
        {!roundComplete && rated.length === 0 && totalLoaded === 0 && (
          <p className="text-size-sm text-secondary mt-2">
            {filtered
              ? 'No unreviewed applications in this round match your filters. Try different filters, or pick a different round.'
              : 'Applications may still be open for this round. Try again later, or pick a different round.'}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-size-xs text-secondary mb-1.5">
          <span>{filtered && 'Whole round: '}{reviewedCount ?? '…'} of {totalCount ?? '…'} reviewed</span>
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

      <div className="border-t border-subtle pt-5 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <H2 className="text-size-sm uppercase tracking-wide text-secondary">Decision emails</H2>
          <span className="text-size-xs text-secondary">
            {(() => {
              if (emailCounts) return `${filtered ? 'Whole round: ' : ''}${emailCounts.alreadySent} of ${emailCounts.reviewed} reviewed sent`;
              if (!countsError) return 'Loading counts…';
              return (
                <button type="button" onClick={refreshEmailCounts} className="underline underline-offset-2 hover:text-primary">
                  Counts unavailable — retry
                </button>
              );
            })()}
          </span>
        </div>
        {emailNotice && !confirmingScope && <Callout tone="error" role="alert">{emailNotice}</Callout>}
        {sendTracker && !confirmingScope && (() => {
          if (sendTracker.phase === 'queueing') {
            return (
              <Callout tone="info" role="status">
                {sendTracker.pendingAtStart === null
                  ? 'Queueing emails… Keep this page open.'
                  : `Queueing emails… (${trackerQueued} of ${sendTracker.expected}) Keep this page open.`}
              </Callout>
            );
          }

          if (sendTracker.flagged === 0) return <Callout tone="info" role="status">Nothing to send — the selected applications already had their emails.</Callout>;
          if (trackerDone) return <Callout tone="success" role="status">{sendTracker.flagged === 1 ? 'Decision email sent.' : `All ${sendTracker.flagged} decision emails sent.`}</Callout>;
          if (stalePolls >= 3) return <Callout tone="warning" role="status">{`Sending emails… (${trackerConfirmed} of ${sendTracker.total}) Progress updates aren't coming through — refresh the page to re-check.`}</Callout>;
          return <Callout tone="info" role="status">{`Sending emails… (${trackerConfirmed} of ${sendTracker.total}) You can leave this page.`}</Callout>;
        })()}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={pendingWrites > 0 || sessionEmailIds.length === 0}
            onClick={() => setConfirmingScope('session')}
            className="min-h-11 flex-1 py-2 px-4 rounded-lg font-semibold text-size-sm border border-strong text-primary hover:bg-tint transition-colors disabled:opacity-40"
          >
            Send for this session ({sessionEmailIds.length})
          </button>
          <button
            type="button"
            disabled={pendingWrites > 0 || !emailCounts || emailCounts.pending === 0}
            onClick={() => setConfirmingScope('round')}
            className="min-h-11 flex-1 py-2 px-4 rounded-lg font-semibold text-size-sm border border-strong text-primary hover:bg-tint transition-colors disabled:opacity-40"
          >
            {filtered ? 'Send all reviewed in round' : 'Send all reviewed'} ({emailCounts?.pending ?? '…'})
          </button>
        </div>
      </div>

      <Modal
        isOpen={confirmingScope !== null}
        setIsOpen={(open) => {
          if (!open) closeConfirm();
        }}
        title="Send decision emails?"
      >
        <div className="space-y-3 sm:min-w-96">
          <p className="text-size-sm text-primary">
            {confirmingScope === 'session'
              ? 'For everyone you reviewed this session:'
              : 'For everyone reviewed in this round, not yet emailed:'}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between border border-info-border bg-info-bg rounded-lg px-3 py-2 text-size-sm">
              <span className="text-info-fg">Acceptance emails</span>
              <span className="font-semibold text-primary">{confirmAccepted}</span>
            </div>
            <div className="flex items-center justify-between border border-error-border bg-error-bg rounded-lg px-3 py-2 text-size-sm">
              <span className="text-error-fg">Rejection emails</span>
              <span className="font-semibold text-primary">{confirmRejected}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              disabled={pendingWrites > 0 || confirmCount === 0 || !confirmingScope}
              onClick={() => confirmingScope && sendDecisionEmails(confirmingScope)}
              className="min-h-11 flex-1 py-2 px-4 rounded-lg font-semibold text-size-sm bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
            >
              Send {confirmCount} email{confirmCount === 1 ? '' : 's'}
            </button>
            <button
              type="button"
              disabled={pendingWrites > 0}
              onClick={closeConfirm}
              className="min-h-11 flex-1 py-2 px-4 rounded-lg font-semibold text-size-sm border border-strong text-primary hover:bg-tint transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <div className="border-t border-subtle pt-5 flex flex-col sm:flex-row gap-3">
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
