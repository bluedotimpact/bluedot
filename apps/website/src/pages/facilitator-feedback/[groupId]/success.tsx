import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { PiCheck, PiCreditCard } from 'react-icons/pi';
import { generateInvoiceUrl } from '../../../lib/generateInvoiceUrl';
import { isFlagged } from '../../../lib/facilitatorFollowUps';
import { trpc } from '../../../utils/trpc';
import FacilitatorFeedbackHeader from '../../../components/courses/FacilitatorFeedbackHeader';
import { useFacilitatorFeedbackStorage } from '../../../hooks/useFacilitatorFeedbackStorage';

const formatNames = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} more`;
};

const FacilitatorFeedbackSuccessPage = () => {
  const router = useRouter();
  const meetPersonId = router.query.groupId as string;

  const { data, isLoading, error } = trpc.facilitators.getFeedbackFormData.useQuery(
    { meetPersonId },
    { enabled: !!meetPersonId },
  );
  const shouldShow404 = error?.data?.code === 'NOT_FOUND' || error?.data?.code === 'UNAUTHORIZED';

  useEffect(() => {
    if (shouldShow404) router.replace('/404');
  }, [shouldShow404, router]);

  const notSubmitted = !!data && data.existingCourseFeedback?.completed !== true;
  useEffect(() => {
    if (notSubmitted) {
      router.replace(`/facilitator-feedback/${meetPersonId}`);
    }
  }, [notSubmitted, meetPersonId, router]);

  const { noStrongImpressionIds } = useFacilitatorFeedbackStorage(meetPersonId);
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (!data) return;
    const completedIds = new Set<string>([
      ...data.existingPeerFeedback.map((pf) => pf.recipientId),
      ...noStrongImpressionIds,
    ]);
    const allComplete = data.participants.length > 0
      && data.participants.every((p) => completedIds.has(p.id));
    if (allComplete) setShowConfetti(true);
  }, [data, noStrongImpressionIds]);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (isLoading || shouldShow404 || !router.isReady || notSubmitted) {
    return (
      <div className="min-h-screen bg-cream-normal flex items-center justify-center">
        <ProgressDots />
      </div>
    );
  }

  if (error ?? !data) {
    return (
      <div className="min-h-screen bg-cream-normal flex items-center justify-center px-4">
        <ErrorSection error={error ?? new Error('Could not load the feedback form. Please refresh the page.')} />
      </div>
    );
  }

  const compensationLumpSum = data.payForFacilitatedDiscussions ?? 0;
  const showInvoiceCard = compensationLumpSum > 0;
  const invoiceUrl = showInvoiceCard
    ? generateInvoiceUrl({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      email: data.email ?? '',
      compensationLumpSum,
      roundTitle: data.roundName,
      contractStartDate: data.roundStartDate ?? '',
      contractEndDate: data.roundLastDiscussionDate ?? '',
    })
    : null;

  const flaggedNames = data.existingPeerFeedback
    .filter((pf) => isFlagged(pf.nextSteps))
    .map((pf) => pf.recipientName)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>{data.roundName ? `Feedback submitted · ${data.roundName}` : 'Feedback submitted'} | BlueDot Impact</title>
      </Head>

      <FacilitatorFeedbackHeader roundName={data.roundName || undefined} />

      {showConfetti && windowSize.width > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={120}
            recycle={false}
            confettiSource={{
              x: windowSize.width * 0.2,
              y: 80,
              w: windowSize.width * 0.6,
              h: 150,
            }}
            initialVelocityX={{ min: -20, max: 20 }}
            initialVelocityY={{ min: -8, max: 18 }}
            friction={0.96}
            gravity={0.4}
            tweenDuration={300}
          />
        </div>
      )}

      <div className="max-w-[680px] mx-auto pt-8 pb-16 px-4 flex flex-col gap-8">
        <section className="bg-white rounded-lg border border-color-divider p-6 sm:p-12 flex flex-col gap-7">
          <div className="flex flex-col gap-4">
            <div className="size-[60px] rounded-full bg-bluedot-normal/10 flex items-center justify-center">
              {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size -- icon glyph size, not body text; 28px fits the 60px container */}
              <PiCheck className="text-bluedot-normal text-[28px]" aria-hidden />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-bluedot-navy leading-8">Feedback submitted!</h1>
              <p className="text-size-xs text-bluedot-navy/70 leading-relaxed">
                Your insights help BlueDot support the most engaged participants and improve every future cohort.
              </p>
            </div>
          </div>

          {flaggedNames.length > 0 && (
            <div className="bg-[#f2fff8] border border-[rgba(5,144,5,0.2)] rounded-md px-4 py-3">
              <p className="text-size-xs leading-relaxed text-[#1a7a52]">
                <span className="font-bold">🙌 You suggested follow-up actions for {formatNames(flaggedNames)}</span>
                <span>{' — we\'ll review these and do our best to act on them.'}</span>
              </p>
            </div>
          )}

          {showInvoiceCard && invoiceUrl && (
            <div className="bg-[#f8f9fb] border border-color-divider rounded-md p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-md bg-bluedot-normal/10 flex items-center justify-center shrink-0">
                  <PiCreditCard className="text-bluedot-normal" aria-hidden />
                </div>
                <p className="text-size-xs font-semibold text-bluedot-navy">Ready to submit your invoice?</p>
              </div>
              <p className="text-size-xs text-bluedot-navy/70 leading-relaxed">
                You can submit your bank details below and expect to receive your compensation within a week. We'll also send you a link by email.
              </p>
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="self-start mt-2 bg-bluedot-normal text-white font-semibold text-size-xs px-6 py-3 rounded-md hover:bg-bluedot-darker transition-colors"
              >
                Submit invoice
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

FacilitatorFeedbackSuccessPage.rawLayout = true;

export default FacilitatorFeedbackSuccessPage;
