import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ProgressDots } from '@bluedot/ui';
import { PiClock, PiLockSimple, PiStar, PiWarningCircle } from 'react-icons/pi';
import StarRating from '../../components/courses/StarRating';
import ParticipantFeedbackModal, { type ParticipantFeedbackData } from '../../components/courses/ParticipantFeedbackModal';
import { FOLLOW_UP_OPTIONS } from '../../lib/facilitatorFollowUps';
import { trpc } from '../../utils/trpc';

type ParticipantFeedback =
  | { status: 'no-strong-impression' }
  | { status: 'completed'; data: ParticipantFeedbackData; flagged: boolean };

const isFlagged = (followUps: Record<string, boolean>) => Object.entries(followUps).some(([key, v]) => v && key !== 'no-action');

const followUpsToAirtable = (followUps: Record<string, boolean>) => FOLLOW_UP_OPTIONS
  .filter((o) => followUps[o.id])
  .map((o) => o.airtableValue);

const airtableToFollowUps = (nextSteps: string[] | null) => {
  const result: Record<string, boolean> = {};
  for (const o of FOLLOW_UP_OPTIONS) {
    if (nextSteps?.includes(o.airtableValue)) result[o.id] = true;
  }

  return result;
};

const FacilitatorFeedbackPage = () => {
  const router = useRouter();
  const meetPersonId = router.query.groupId as string;

  const { data: formData, isLoading } = trpc.facilitators.getFeedbackFormData.useQuery(
    { meetPersonId },
    { enabled: !!meetPersonId },
  );

  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string } | null>(null);
  const [feedbackByParticipant, setFeedbackByParticipant] = useState<Record<string, ParticipantFeedback>>({});
  const [overallRating, setOverallRating] = useState(0);
  const [mostValuable, setMostValuable] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  const noStrongImpressionKey = `facilitator-feedback:${meetPersonId}:no-strong-impression`;

  useEffect(() => {
    if (!formData) return;

    if (formData.existingCourseFeedback) {
      setOverallRating(formData.existingCourseFeedback.courseRating ?? 0);
      setMostValuable(formData.existingCourseFeedback.courseValue ?? '');
      setDifficulties(formData.existingCourseFeedback.improvements ?? '');
    }

    const initial: Record<string, ParticipantFeedback> = {};

    // Restore no-strong-impression from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem(noStrongImpressionKey) ?? '[]') as string[];
      for (const id of stored) {
        initial[id] = { status: 'no-strong-impression' };
      }
    } catch { /* ignore corrupt localStorage */ }

    for (const pf of formData.existingPeerFeedback) {
      const followUps = airtableToFollowUps(pf.nextSteps);
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
  }, [formData, noStrongImpressionKey]);

  const savePeerFeedback = trpc.facilitators.savePeerFeedback.useMutation();
  const submitFeedback = trpc.facilitators.submitFeedback.useMutation();
  const unsubmitFeedback = trpc.facilitators.unsubmitFeedback.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-normal flex items-center justify-center">
        <ProgressDots />
      </div>
    );
  }

  const roundName = formData?.roundName ?? '';
  const participants = formData?.participants ?? [];
  const dropIns = formData?.dropIns ?? [];
  const completedCount = participants.filter((p) => feedbackByParticipant[p.id]).length;
  const selectedFeedback = selectedParticipant ? feedbackByParticipant[selectedParticipant.id] : undefined;
  const selectedInitialData = selectedFeedback?.status === 'completed' ? selectedFeedback.data : undefined;
  const submitPayload = {
    meetPersonId,
    courseRating: overallRating,
    courseValue: mostValuable,
    improvements: difficulties,
  };

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>{roundName ? `Course Feedback · ${roundName}` : 'Course Feedback'} | BlueDot Impact</title>
      </Head>

      <div className="max-w-[680px] mx-auto py-8 px-4">
        {/* Hero card */}
        <section className="bg-white rounded-xl border border-t-8 border-t-bluedot-normal p-5 sm:p-9 mb-8 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Course Feedback</h1>
            <p className="text-size-xs font-medium text-bluedot-normal">{roundName}</p>
          </div>
          <div className="flex flex-col gap-2 text-size-xs text-gray-600">
            <div className="flex items-center gap-2"><PiStar className="shrink-0" aria-hidden />Help us improve the course and support the right people.</div>
            <div className="flex items-center gap-2"><PiClock className="shrink-0" aria-hidden />8–10 min for course questions + a few min per participant.</div>
            <div className="flex items-center gap-2"><PiLockSimple className="shrink-0" aria-hidden />Your responses are only seen by BlueDot staff.</div>
          </div>
        </section>

        {/* Course feedback card */}
        <section className="bg-white rounded-xl border p-5 sm:p-9 mb-8 flex flex-col gap-7">
          <div className="flex flex-col gap-4">
            <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-normal">Course feedback</p>
            <div className="flex flex-col gap-1">
              <h2 className="text-size-lg font-bold text-bluedot-navy">How did the course go?</h2>
              <p className="text-size-xs text-bluedot-navy leading-relaxed">Your honest feedback helps us improve the course and calibrate quality across cohorts.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-size-xs font-semibold text-bluedot-navy">
              Overall rating <span className="text-red-600">*</span>
            </p>
            <StarRating rating={overallRating} onChange={setOverallRating} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="most-valuable" className="text-size-xs font-semibold text-bluedot-navy">
                What did you find most valuable? <span className="text-red-600">*</span>
              </label>
              <p className="text-size-xs text-gray-500">Describe a specific moment or element that stands out.</p>
            </div>
            <textarea
              id="most-valuable"
              value={mostValuable}
              onChange={(e) => setMostValuable(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="difficulties" className="text-size-xs font-semibold text-bluedot-navy">
                Where did you face difficulties? <span className="text-red-600">*</span>
              </label>
              <p className="text-size-xs text-gray-500">Share at least two specific situations — underprepared moments, curriculum gaps, platform issues, or cohort challenges.</p>
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
        <section className="bg-white rounded-xl border p-5 sm:p-9 sm:pb-7 mb-8 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <p className="text-size-xxs font-semibold uppercase tracking-wider text-bluedot-normal">Participant insights</p>
            <div className="flex flex-col gap-2">
              <h2 className="text-size-lg font-bold text-bluedot-navy">Share your insights on each participant</h2>
              <p className="text-size-xs text-gray-600 leading-relaxed">
                We use it to identify the most promising participants in your cohort and decide how to back them — whether that's career introductions, grants, or an invitation to facilitate.
              </p>
              <p className="text-size-xs text-gray-600 leading-relaxed">
                We recommend starting with participants who stood out in the course.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-size-xxs font-semibold uppercase tracking-wider text-gray-500">Cohort members</p>
            <div className="flex flex-col gap-2">
              {participants.map((participant) => (
                <div key={participant.id}>
                  <ParticipantCard
                    participant={participant}
                    feedback={feedbackByParticipant[participant.id]}
                    showNudge={showIncompleteWarning}
                    onClick={() => setSelectedParticipant(participant)}
                  />
                </div>
              ))}
            </div>
          </div>

          {dropIns.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-size-xxs font-semibold uppercase tracking-wider text-gray-500">Drop-ins</p>
                <p className="text-size-xs text-gray-500">Joined one or more of your group's discussions.</p>
              </div>
              <div className="flex flex-col gap-2">
                {dropIns.map((participant) => (
                  <div key={participant.id}>
                    <ParticipantCard
                      participant={participant}
                      feedback={feedbackByParticipant[participant.id]}
                      showNudge={false}
                      onClick={() => setSelectedParticipant(participant)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            className="self-start flex items-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2.5 text-size-xs font-medium text-bluedot-navy transition-colors cursor-pointer hover:bg-gray-50 active:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
          >
            <span aria-hidden>+</span>
            Add a participant
          </button>
        </section>

        {/* Submit section */}
        <section className="bg-white rounded-lg border p-5 mb-8 flex flex-col gap-3">
          {showIncompleteWarning && completedCount < participants.length ? (
            <>
              <div className="flex gap-2 items-start bg-orange-50 text-orange-800 text-size-xs rounded-md p-3 border border-orange-200">
                <PiWarningCircle className="shrink-0 mt-0.5 text-base" aria-hidden />
                <p>
                  <span className="font-semibold">{participants.length - completedCount} participants still need feedback.</span>
                  {' '}
                  Even just a star rating or "no strong impression" on each one helps BlueDot understand where they stand.
                </p>
              </div>
              <button
                type="button"
                className="self-start text-size-xs text-gray-500 underline cursor-pointer transition-colors hover:text-gray-700 disabled:opacity-50 disabled:pointer-events-none"
                disabled={submitFeedback.isPending}
                onClick={() => {
                  /* TODO: error handling */ submitFeedback.mutateAsync(submitPayload);
                }}
              >
                {submitFeedback.isPending ? 'Submitting...' : 'Submit anyway'}
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <button
                type="button"
                className="w-full sm:w-auto bg-bluedot-normal text-white px-6 py-3 rounded-md text-size-xs leading-5 font-semibold transition-colors cursor-pointer hover:bg-bluedot-darker disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
                disabled={submitFeedback.isPending || overallRating === 0}
                onClick={() => {
                  if (completedCount < participants.length) {
                    setShowIncompleteWarning(true);
                  } else {
                    // TODO: error handling
                    submitFeedback.mutateAsync(submitPayload);
                  }
                }}
              >
                {submitFeedback.isPending ? 'Submitting...' : 'Submit feedback'}
              </button>
              <p className="text-size-xs text-gray-600">
                <span className="font-semibold text-bluedot-navy">{completedCount}</span> of <span className="font-semibold text-bluedot-navy">{participants.length}</span> participant feedback completed
              </p>
            </div>
          )}
          {formData?.existingCourseFeedback?.submittedAt != null && (
            <button
              type="button"
              className="self-start text-size-xxs text-gray-400 underline cursor-pointer"
              onClick={() => {
                /* TODO: error handling */ unsubmitFeedback.mutateAsync({ meetPersonId }).then(() => window.location.reload());
              }}
            >
              [Debug] Unsubmit
            </button>
          )}
        </section>
      </div>

      {selectedParticipant && (
        <ParticipantFeedbackModal
          participant={selectedParticipant}
          initialData={selectedInitialData}
          isSaving={savePeerFeedback.isPending}
          onClose={() => setSelectedParticipant(null)}
          onSave={async (data) => {
            // TODO: error handling
            await savePeerFeedback.mutateAsync({
              meetPersonId,
              participantId: selectedParticipant.id,
              initiativeRating: data.showUpRating,
              reasoningQualityRating: data.engageRating,
              feedback: data.investmentNote,
              nextSteps: followUpsToAirtable(data.followUps),
            });
            setFeedbackByParticipant({
              ...feedbackByParticipant,
              [selectedParticipant.id]: {
                status: 'completed', data, flagged: isFlagged(data.followUps),
              },
            });
            setSelectedParticipant(null);
          }}
          onNoStrongImpression={() => {
            const updated = {
              ...feedbackByParticipant,
              [selectedParticipant.id]: { status: 'no-strong-impression' as const },
            };
            setFeedbackByParticipant(updated);
            // Persist to localStorage
            const nsiIds = Object.entries(updated)
              .filter(([, f]) => f.status === 'no-strong-impression')
              .map(([id]) => id);
            localStorage.setItem(noStrongImpressionKey, JSON.stringify(nsiIds));
            setSelectedParticipant(null);
          }}
        />
      )}
    </div>
  );
};

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
  if (feedback.flagged) parts.push('→ Flagged');
  return parts.join(' · ');
};

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, feedback, showNudge, onClick }) => {
  const initials = participant.name.split(' ').map((n) => n[0]).join('');
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 border border-gray-300 rounded-lg px-3 sm:px-4 py-3.5 text-left transition-colors cursor-pointer hover:bg-gray-50 active:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
    >
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-size-xs font-bold ${feedback ? 'bg-bluedot-normal' : 'bg-bluedot-navy'}`}>
        {feedback ? '✓' : initials}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-size-xs font-semibold text-bluedot-navy">{participant.name}</p>
        <p className="text-size-xxs text-gray-500">{getSubtitle(feedback)}</p>
        {showNudge && !feedback && (
          <p className="text-size-xs text-bluedot-normal">ℹ Even just a star rating helps</p>
        )}
      </div>
      <span className="shrink-0 text-size-xs font-medium text-bluedot-normal">
        {feedback ? 'Edit' : 'Add feedback →'}
      </span>
    </button>
  );
};
