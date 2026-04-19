import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ProgressDots } from '@bluedot/ui';
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
  }, [formData]);

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

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Hero card */}
        <section className="bg-white rounded-lg border border-t-4 border-t-bluedot-normal p-8 mb-6">
          <h1>Course Feedback</h1>
          <p className="text-bluedot-normal mb-4">{roundName}</p>
          <ul className="text-size-sm text-gray-600 space-y-1">
            <li>☆ Help us improve the course and support the right people.</li>
            <li>⏱ 8–10 min for course questions + a few min per participant.</li>
            <li>🔒 Your responses are only seen by BlueDot staff.</li>
          </ul>
        </section>

        {/* Course feedback card */}
        <section className="bg-white rounded-lg border p-8 mb-6">
          <p className="text-size-xs uppercase tracking-wide text-gray-500 mb-2">Course feedback</p>
          <h2>How did the course go?</h2>
          <p className="text-size-sm text-gray-600 mb-6">Your honest feedback helps us improve the course and calibrate quality across cohorts.</p>

          <label className="block mb-1 font-medium">
            Overall rating <span className="text-red-500">*</span>
          </label>
          <StarRating rating={overallRating} onChange={setOverallRating} />

          <label htmlFor="most-valuable" className="block mt-6 mb-1 font-medium">
            What did you find most valuable? <span className="text-red-500">*</span>
          </label>
          <p className="text-size-sm text-gray-500 mb-1">Describe a specific moment or element that stands out.</p>
          <textarea
            id="most-valuable"
            value={mostValuable}
            onChange={(e) => setMostValuable(e.target.value)}
            rows={3}
            className="w-full border rounded p-2"
          />

          <label htmlFor="difficulties" className="block mt-6 mb-1 font-medium">
            Where did you face difficulties? <span className="text-red-500">*</span>
          </label>
          <p className="text-size-sm text-gray-500 mb-1">Share at least two specific situations — underprepared moments, curriculum gaps, platform issues, or cohort challenges.</p>
          <textarea
            id="difficulties"
            value={difficulties}
            onChange={(e) => setDifficulties(e.target.value)}
            placeholder="The more specific your feedback is, the easier it is for us to take action on it."
            rows={3}
            className="w-full border rounded p-2"
          />
        </section>

        {/* Participant insights card */}
        <section className="bg-white rounded-lg border p-8 mb-6">
          <p className="text-size-xs uppercase tracking-wide text-gray-500 mb-2">Participant insights</p>
          <h2>Share your insights on each participant</h2>
          <p className="text-size-sm text-gray-600 mb-2">
            We use it to identify the most promising participants in your cohort and decide how to back them — whether that's career introductions, grants, or an invitation to facilitate.
          </p>
          <p className="text-size-sm text-gray-600 mb-6">
            We recommend starting with participants who stood out in the course.
          </p>

          <p className="text-size-xs uppercase tracking-wide text-gray-500 mb-2">Cohort members</p>
          <ul>
            {participants.map((participant) => (
              <li key={participant.id}>
                <ParticipantCard
                  participant={participant}
                  feedback={feedbackByParticipant[participant.id]}
                  showNudge={showIncompleteWarning}
                  onClick={() => setSelectedParticipant(participant)}
                />
              </li>
            ))}
          </ul>

          {dropIns.length > 0 && (
            <>
              <p className="text-size-xs uppercase tracking-wide text-gray-500 mt-6 mb-2">Drop-ins</p>
              <ul>
                {dropIns.map((participant) => (
                  <li key={participant.id}>
                    <ParticipantCard
                      participant={participant}
                      feedback={feedbackByParticipant[participant.id]}
                      showNudge={false}
                      onClick={() => setSelectedParticipant(participant)}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          <button type="button" className="text-size-sm text-gray-500 mt-2">+ Add a participant</button>
        </section>

        {/* Submit section */}
        <section className="bg-white rounded-lg border p-8 mb-8">
          {showIncompleteWarning && completedCount < participants.length ? (
            <>
              <p className="flex gap-2 items-start bg-orange-50 text-orange-800 text-size-sm rounded p-3 border border-orange-200">
                <span className="shrink-0">⚠</span>
                {participants.length - completedCount} participants still need feedback. Even just a star rating or "no strong impression" on each one helps BlueDot understand where they stand.
              </p>
              <button
                type="button"
                className="text-size-sm text-gray-500 mt-2 underline"
                disabled={submitFeedback.isPending}
                onClick={() => {
                  /* TODO: error handling */ submitFeedback.mutateAsync(submitPayload);
                }}
              >
                {submitFeedback.isPending ? 'Submitting...' : 'Submit anyway'}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="bg-bluedot-normal text-white px-6 py-3 rounded-lg font-medium"
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
              <p className="text-size-sm text-gray-500">
                {completedCount} of {participants.length} participant feedback completed
              </p>
            </div>
          )}
          {formData?.existingCourseFeedback?.submittedAt != null && (
            <button
              type="button"
              className="text-size-xs text-gray-400 mt-2"
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
      className="w-full flex items-center justify-between border rounded-lg p-4 mb-2 text-left"
    >
      <div className="flex items-center gap-3">
        {feedback ? (
          <div className="w-10 h-10 rounded-full bg-bluedot-normal text-white flex items-center justify-center text-size-sm">✓</div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-size-sm font-medium">{initials}</div>
        )}
        <div>
          <p className="font-medium">{participant.name}</p>
          <p className="text-size-sm text-gray-400">{getSubtitle(feedback)}</p>
          {showNudge && !feedback && (
            <p className="text-size-xs text-bluedot-normal">ℹ Even just a star rating helps</p>
          )}
        </div>
      </div>
      <span className="text-size-sm text-bluedot-normal">
        {feedback ? 'Edit' : 'Add feedback →'}
      </span>
    </button>
  );
};
