import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import {
  PiClock, PiLockSimple, PiStar, PiWarningCircle,
} from 'react-icons/pi';
import StarRating from '../../components/courses/StarRating';
import ParticipantFeedbackModal, { type ParticipantFeedbackData } from '../../components/courses/ParticipantFeedbackModal';
import AddParticipantModal from '../../components/courses/AddParticipantModal';
import FacilitatorFeedbackHeader from '../../components/courses/FacilitatorFeedbackHeader';
import { useFacilitatorFeedbackStorage } from '../../hooks/useFacilitatorFeedbackStorage';
import { isFlagged } from '../../lib/facilitatorFollowUps';
import { getInitials } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

type ParticipantFeedback =
  | { status: 'no-strong-impression' }
  | { status: 'completed'; data: ParticipantFeedbackData; flagged: boolean };

const FacilitatorFeedbackPage = () => {
  const router = useRouter();
  const meetPersonId = router.query.groupId as string;

  const { data: formData, isLoading, error } = trpc.facilitators.getFeedbackFormData.useQuery(
    { meetPersonId },
    { enabled: !!meetPersonId },
  );
  const shouldShow404 = error?.data?.code === 'NOT_FOUND' || error?.data?.code === 'UNAUTHORIZED';

  useEffect(() => {
    if (shouldShow404) router.replace('/404');
  }, [shouldShow404, router]);

  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string } | null>(null);
  const [feedbackByParticipant, setFeedbackByParticipant] = useState<Record<string, ParticipantFeedback>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [mostValuable, setMostValuable] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const participantInsightsRef = useRef<HTMLElement>(null);

  const {
    noStrongImpressionIds,
    setNoStrongImpressionIds,
    addedParticipants,
    addParticipant,
  } = useFacilitatorFeedbackStorage(meetPersonId);

  useEffect(() => {
    if (!formData) return;

    if (formData.existingCourseFeedback) {
      setOverallRating(formData.existingCourseFeedback.courseRating ?? 0);
      setMostValuable(formData.existingCourseFeedback.courseValue ?? '');
      setDifficulties(formData.existingCourseFeedback.improvements ?? '');
    }

    const initial: Record<string, ParticipantFeedback> = {};
    for (const id of noStrongImpressionIds) {
      initial[id] = { status: 'no-strong-impression' };
    }

    for (const pf of formData.existingPeerFeedback) {
      const followUps = pf.nextSteps ?? [];
      initial[pf.recipientId] = {
        status: 'completed',
        data: {
          showUpRating: pf.initiativeRating ?? 0,
          engageRating: pf.reasoningQualityRating ?? 0,
          investmentNote: pf.feedback ?? '',
          followUps,
        },
        flagged: isFlagged(followUps),
      };
    }

    setFeedbackByParticipant(initial);
    // Read localStorage values once when formData arrives; don't re-hydrate on
    // subsequent user-driven changes (which would wipe in-flight local saves).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const utils = trpc.useUtils();
  const submitFeedback = trpc.facilitators.submitFeedback.useMutation();
  const unsubmitFeedback = trpc.facilitators.unsubmitFeedback.useMutation();
  const { data: currentUser } = trpc.users.getUser.useQuery();
  const isAdmin = currentUser?.isAdmin === true;

  if (isLoading || shouldShow404 || !router.isReady) {
    return (
      <div className="min-h-screen bg-cream-normal flex items-center justify-center">
        <ProgressDots />
      </div>
    );
  }

  if (error ?? !formData) {
    return (
      <div className="min-h-screen bg-cream-normal flex items-center justify-center px-4">
        <ErrorSection error={error ?? new Error('Could not load the feedback form. Please refresh the page.')} />
      </div>
    );
  }

  const roundName = formData?.roundName ?? '';
  const participants = formData?.participants ?? [];
  const dropIns = formData?.dropIns ?? [];
  // Recipients with saved peerFeedback who aren't in the current participants/drop-ins lists —
  // surface them in the same "Added by you" section so the facilitator can edit/see them.
  const knownIds = new Set([
    ...participants.map((p) => p.id),
    ...dropIns.map((p) => p.id),
    ...addedParticipants.map((p) => p.id),
  ]);
  const serverOrphanParticipants = (formData?.existingPeerFeedback ?? [])
    .filter((pf) => !knownIds.has(pf.recipientId))
    .map((pf) => ({ id: pf.recipientId, name: pf.recipientName }));
  const displayedAddedParticipants = [...addedParticipants, ...serverOrphanParticipants];
  const allFeedbackTargets = [...participants, ...dropIns, ...displayedAddedParticipants];
  const completedCount = allFeedbackTargets.filter((p) => feedbackByParticipant[p.id]).length;
  const totalCount = allFeedbackTargets.length;
  const selectedFeedback = selectedParticipant ? feedbackByParticipant[selectedParticipant.id] : undefined;
  const selectedInitialData = selectedFeedback?.status === 'completed' ? selectedFeedback.data : undefined;
  const submitPayload = {
    meetPersonId,
    courseRating: overallRating,
    courseValue: mostValuable,
    improvements: difficulties,
  };
  const alreadySubmitted = formData?.existingCourseFeedback?.submittedAt != null;
  const submitIdleLabel = alreadySubmitted ? 'Update feedback' : 'Submit feedback';
  const submitAnywayIdleLabel = alreadySubmitted ? 'Update anyway' : 'Submit anyway';

  const handleParticipantSaved = (data: ParticipantFeedbackData) => {
    if (!selectedParticipant) return;

    setFeedbackByParticipant({
      ...feedbackByParticipant,
      [selectedParticipant.id]: {
        status: 'completed', data, flagged: isFlagged(data.followUps),
      },
    });
    setSelectedParticipant(null);
  };

  const handleNoStrongImpression = () => {
    if (!selectedParticipant) return;

    setFeedbackByParticipant({
      ...feedbackByParticipant,
      [selectedParticipant.id]: { status: 'no-strong-impression' as const },
    });
    if (!noStrongImpressionIds.includes(selectedParticipant.id)) {
      setNoStrongImpressionIds([...noStrongImpressionIds, selectedParticipant.id]);
    }

    setSelectedParticipant(null);
  };

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>{roundName ? `Course Feedback · ${roundName}` : 'Course Feedback'} | BlueDot Impact</title>
      </Head>

      <FacilitatorFeedbackHeader roundName={roundName || undefined} />

      <div className="max-w-[680px] mx-auto pt-8 pb-16 px-4 flex flex-col gap-8">
        {(submitFeedback.isError || unsubmitFeedback.isError) && (
          <ErrorSection error={submitFeedback.error ?? unsubmitFeedback.error} />
        )}

        {/* Hero card */}
        <section className="bg-white rounded-xl border border-t-8 border-t-bluedot-normal p-5 sm:p-9 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Course Feedback</h1>
            <p className="text-size-xs font-medium text-bluedot-normal">{roundName}</p>
          </div>
          <div className="flex flex-col gap-2 text-size-xs text-bluedot-navy/60">
            <div className="flex items-center gap-2"><PiStar className="shrink-0" aria-hidden />Help us improve the course and support participants.</div>
            <div className="flex items-center gap-2"><PiClock className="shrink-0" aria-hidden />8–10 min for course questions + a few min per participant.</div>
            <div className="flex items-center gap-2"><PiLockSimple className="shrink-0" aria-hidden />Your responses are only seen by BlueDot staff.</div>
          </div>
        </section>

        {/* Course feedback card */}
        <section className="bg-white rounded-xl border p-5 sm:p-9 flex flex-col gap-7">
          <div className="flex flex-col gap-4">
            <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-normal">Course feedback</p>
            <div className="flex flex-col gap-1">
              <h2 className="text-size-lg font-bold text-bluedot-navy">How did the course go?</h2>
              <p className="text-size-xs text-bluedot-navy/60 leading-relaxed">Your honest feedback helps us improve the course and calibrate quality across cohorts.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-size-xs font-semibold text-bluedot-navy">
              Overall rating <span className="text-red-600">*</span>
            </p>
            <StarRating rating={overallRating} onChange={setOverallRating} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="most-valuable" className="text-size-xs font-semibold text-bluedot-navy">
                What did you find most valuable? <span className="text-red-600">*</span>
              </label>
              <p className="text-size-xs text-bluedot-navy/60">Describe a specific moment or element that stands out.</p>
            </div>
            <textarea
              id="most-valuable"
              value={mostValuable}
              onChange={(e) => setMostValuable(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="difficulties" className="text-size-xs font-semibold text-bluedot-navy">
                Where did you face difficulties? <span className="text-red-600">*</span>
              </label>
              <p className="text-size-xs text-bluedot-navy/60">Share at least two specific situations — underprepared moments, curriculum gaps, platform issues, or cohort challenges.</p>
            </div>
            <textarea
              id="difficulties"
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              placeholder="The more specific your feedback is, the easier it is for us to take action on it."
              rows={4}
              className="w-full border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy placeholder:text-gray-400"
            />
          </div>
        </section>

        {/* Participant insights card */}
        <section ref={participantInsightsRef} className="bg-white rounded-xl border p-5 sm:p-9 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-normal">Participant insights</p>
            <div className="flex flex-col gap-2">
              <h2 className="text-size-lg font-bold text-bluedot-navy">Share your insights on each participant</h2>
              <p className="text-size-xs text-bluedot-navy/60 leading-relaxed">
                We use it to identify the most promising participants in your cohort and decide how to back them — whether that's career introductions, grants, or an invitation to facilitate.
              </p>
              <p className="text-size-xs text-bluedot-navy/60 leading-relaxed">
                We recommend starting with participants who stood out in the course.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-navy/50">Cohort members</p>
            <div className="flex flex-col gap-2">
              {participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  feedback={feedbackByParticipant[participant.id]}
                  showNudge={showIncompleteWarning}
                  onClick={() => setSelectedParticipant(participant)}
                />
              ))}
            </div>
          </div>

          {dropIns.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-navy/50">Drop-ins</p>
                <p className="text-size-xs text-bluedot-navy/60">Joined one or more of your group's discussions.</p>
              </div>
              <div className="flex flex-col gap-2">
                {dropIns.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    feedback={feedbackByParticipant[participant.id]}
                    showNudge={showIncompleteWarning}
                    onClick={() => setSelectedParticipant(participant)}
                  />
                ))}
              </div>
            </div>
          )}

          {displayedAddedParticipants.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-navy/50">Added by you</p>
              <div className="flex flex-col gap-2">
                {displayedAddedParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    feedback={feedbackByParticipant[participant.id]}
                    showNudge={showIncompleteWarning}
                    onClick={() => setSelectedParticipant(participant)}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="self-start flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2.5 text-size-xs font-medium text-bluedot-navy transition-colors cursor-pointer hover:bg-gray-50 active:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
          >
            <span aria-hidden>+</span>
            Add a participant
          </button>
        </section>

        {/* Submit section */}
        <section className="bg-white rounded-lg border p-5 flex flex-col gap-3">
          {showIncompleteWarning && completedCount < totalCount ? (
            <>
              <div className="flex gap-2 items-start bg-orange-50 text-orange-800 text-size-xs rounded-md p-3 border border-orange-200">
                <PiWarningCircle className="shrink-0 mt-0.5 text-size-md" aria-hidden />
                <p>
                  <span className="font-semibold">{totalCount - completedCount} participants still need feedback.</span>
                  {' '}
                  Even just a star rating or "no strong impression" on each one helps BlueDot understand where they stand.
                </p>
              </div>
              <button
                type="button"
                className="self-start text-size-xs text-bluedot-navy/50 underline cursor-pointer transition-colors hover:text-bluedot-navy/80 disabled:opacity-50 disabled:pointer-events-none"
                disabled={submitFeedback.isPending}
                onClick={() => submitFeedback.mutate(submitPayload, {
                  onSuccess: async () => {
                    await utils.facilitators.getFeedbackFormData.invalidate({ meetPersonId });
                    router.push(`/facilitator-feedback/${meetPersonId}/success`);
                  },
                })}
              >
                {submitFeedback.isPending ? 'Saving...' : submitAnywayIdleLabel}
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                className="w-full sm:w-auto bg-bluedot-normal text-white px-6 py-3 rounded-md text-size-xs leading-5 font-semibold transition-colors cursor-pointer hover:bg-bluedot-darker disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
                disabled={submitFeedback.isPending || overallRating === 0 || !mostValuable.trim() || !difficulties.trim()}
                onClick={() => {
                  if (completedCount < totalCount) {
                    setShowIncompleteWarning(true);
                    participantInsightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    submitFeedback.mutate(submitPayload, {
                      onSuccess: async () => {
                        await utils.facilitators.getFeedbackFormData.invalidate({ meetPersonId });
                        router.push(`/facilitator-feedback/${meetPersonId}/success`);
                      },
                    });
                  }
                }}
              >
                {submitFeedback.isPending ? 'Saving...' : submitIdleLabel}
              </button>
              <p className="text-size-xs text-bluedot-navy/60">
                <span className="font-semibold text-bluedot-navy">{completedCount}</span> of <span className="font-semibold text-bluedot-navy">{totalCount}</span> participant feedback completed
              </p>
            </div>
          )}
          {isAdmin && formData?.existingCourseFeedback?.submittedAt != null && (
            <button
              type="button"
              className="self-start text-size-xxs text-bluedot-navy/40 underline cursor-pointer"
              onClick={() => unsubmitFeedback.mutate({ meetPersonId }, {
                onSuccess: () => window.location.reload(),
              })}
            >
              Unsubmit (admin)
            </button>
          )}
        </section>
      </div>

      {selectedParticipant && (
        <ParticipantFeedbackModal
          meetPersonId={meetPersonId}
          participant={selectedParticipant}
          followUpOptions={formData.followUpOptions}
          initialData={selectedInitialData}
          onClose={() => setSelectedParticipant(null)}
          onSaved={handleParticipantSaved}
          onNoStrongImpression={handleNoStrongImpression}
        />
      )}

      {isAddModalOpen && (
        <AddParticipantModal
          meetPersonId={meetPersonId}
          excludeIds={displayedAddedParticipants.map((p) => p.id)}
          onAdd={addParticipant}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

FacilitatorFeedbackPage.rawLayout = true;

export default FacilitatorFeedbackPage;

// --- ParticipantCard ---

type ParticipantCardProps = {
  participant: { id: string; name: string };
  feedback: ParticipantFeedback | undefined;
  showNudge: boolean;
  onClick: () => void;
};

const getSubtitle = (feedback: ParticipantFeedback | undefined): string => {
  if (!feedback) return 'Not yet completed';
  if (feedback.status === 'no-strong-impression') return 'No strong impression';
  const parts = [
    `Initiative & preparation: ${feedback.data.showUpRating}/5`,
    `Quality of contribution: ${feedback.data.engageRating}/5`,
  ];
  if (feedback.flagged) parts.push('⭐ Flagged');
  return parts.join(' · ');
};

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, feedback, showNudge, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3.5 text-left transition-colors cursor-pointer hover:bg-gray-50 active:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
    >
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-size-xs font-bold ${feedback ? 'bg-bluedot-normal' : 'bg-bluedot-navy'}`}>
        {feedback ? '✓' : getInitials(participant.name)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-size-xs font-semibold text-bluedot-navy">{participant.name}</p>
        <p className="text-size-xxs text-bluedot-navy/50">{getSubtitle(feedback)}</p>
        {showNudge && !feedback && (
          <p className="flex items-center gap-1 text-size-xxs leading-[16.5px] font-medium text-[#cc6b11]">
            <PiWarningCircle className="size-[11px] shrink-0" aria-hidden />
            Even just a star rating helps
          </p>
        )}
      </div>
      <span className="shrink-0 text-size-xs font-medium text-bluedot-normal">
        {feedback ? 'Edit' : 'Add feedback →'}
      </span>
    </button>
  );
};
