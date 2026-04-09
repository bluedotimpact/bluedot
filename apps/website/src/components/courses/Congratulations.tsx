import {
  addQueryParam,
  cn,
  CTALinkOrButton,
  H2,
  P,
  ProgressDots,
  useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
import type React from 'react';
import { useState } from 'react';
import {
  FaCopy, FaLinkedinIn, FaWhatsapp, FaXTwitter,
} from 'react-icons/fa6';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { ROUTES } from '../../lib/routes';
import { getActionPlanUrl } from '../../lib/utils';
import type { CertificateStatus } from '../../server/routers/certificates';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { trpc } from '../../utils/trpc';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

export const CERTIFICATE_STATUS_DESCRIPTIONS: Record<CertificateStatus, string> = {
  'action-plan-pending': 'To receive your certificate, you need to submit an action plan/project and can\'t have missed more than one discussion.',
  'can-request': 'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
  'facilitator-pending': 'Your certificate will be issued after your cohort ends, based on attendance.',
  'has-certificate': '',
  'not-eligible': 'This course doesn\'t currently issue certificates to independent learners. Join a facilitated version to get a certificate.',
};

const secondaryBtnClass
  = 'flex flex-1 items-center justify-center gap-2 bg-[rgba(19,19,46,0.05)] rounded-[5px] px-4 py-[7px] text-[13px] font-medium text-bluedot-navy/80 hover:bg-[rgba(19,19,46,0.1)] transition-colors no-underline';

type ActionCardProps = {
  number: number;
  title: string;
  description: string;
  actions: React.ReactNode;
};

const ActionCard = ({
  number, title, description, actions,
}: ActionCardProps) => (
  <div className="bg-white border-[0.5px] border-[rgba(19,19,46,0.25)] rounded-[10px] overflow-hidden p-10 flex flex-col gap-12">
    <div className="flex flex-col gap-6">
      <div className="border-2 border-[rgba(19,19,46,0.08)] rounded-[12px] size-16 flex items-center justify-center shrink-0">
        <span className="font-bold text-[32px] leading-[1.3] tracking-[-0.015em] text-bluedot-navy">
          {number}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-[18px] leading-[1.4] text-bluedot-navy">{title}</h3>
        {description && <P className="text-[16px] leading-[1.6] tracking-[-0.002em] text-bluedot-navy">{description}</P>}
      </div>
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

type CertificateCardProps = { courseId: string };

const CertificateCardAuthed = ({ courseId }: CertificateCardProps) => {
  const { data: certificateData, isLoading, error, refetch } = trpc.certificates.getStatus.useQuery({ courseId });

  const requestCertificateMutation = trpc.certificates.request.useMutation({
    onSuccess: async () => {
      await refetch();
      if (typeof window !== 'undefined' && window.dataLayer && courseId === FOAI_COURSE_ID) {
        window.dataLayer.push({ event: 'completers', course_slug: 'future-of-ai' });
      }
    },
  });

  if (isLoading || requestCertificateMutation.isPending) {
    return (
      <ActionCard number={3} title="Grab your certificate" description="" actions={<ProgressDots />} />
    );
  }

  if (error != null || requestCertificateMutation.isError) {
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description=""
        actions={(
          <div className="flex flex-col gap-4">
            <ErrorView error={error ?? requestCertificateMutation.error} />
            <CTALinkOrButton
              variant="primary"
              onClick={() => (error ? refetch() : requestCertificateMutation.mutate({ courseId }))}
            >
              Retry
            </CTALinkOrButton>
          </div>
        )}
      />
    );
  }

  if (certificateData?.status === 'has-certificate') {
    const formattedDate = new Date(certificateData.issuedAt * 1000).toLocaleDateString(undefined, { dateStyle: 'long' });
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description={`Earned by ${certificateData.holderName} · Issued ${formattedDate}`}
        actions={(
          <CTALinkOrButton
            url={addQueryParam(ROUTES.certification.url, 'id', certificateData.certificateId)}
            variant="primary"
            target="_blank"
          >
            View Certificate
          </CTALinkOrButton>
        )}
      />
    );
  }

  if (certificateData?.status === 'action-plan-pending') {
    const actionPlanUrl = getActionPlanUrl(certificateData.meetPersonId);
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description={CERTIFICATE_STATUS_DESCRIPTIONS['action-plan-pending']}
        actions={(
          <CTALinkOrButton
            url={actionPlanUrl}
            variant="primary"
            target="_blank"
            disabled={certificateData.hasSubmittedActionPlan ?? false}
          >
            {certificateData.hasSubmittedActionPlan ? 'Submitted!' : 'Submit your plan here'}
          </CTALinkOrButton>
        )}
      />
    );
  }

  if (certificateData?.status === 'can-request') {
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description={CERTIFICATE_STATUS_DESCRIPTIONS['can-request']}
        actions={(
          <CTALinkOrButton
            variant="primary"
            onClick={() => requestCertificateMutation.mutate({ courseId })}
          >
            Download Certificate
          </CTALinkOrButton>
        )}
      />
    );
  }

  if (certificateData?.status === 'facilitator-pending') {
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description={CERTIFICATE_STATUS_DESCRIPTIONS['facilitator-pending']}
        actions={null}
      />
    );
  }

  // not-eligible (and any other status)
  return (
    <ActionCard
      number={3}
      title="Grab your certificate"
      description={CERTIFICATE_STATUS_DESCRIPTIONS['not-eligible']}
      actions={null}
    />
  );
};

const CertificateCard = ({ courseId }: CertificateCardProps) => {
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  if (!auth) {
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description="Create a free account to earn your course certificate."
        actions={(
          <CTALinkOrButton url={getLoginUrl(router.asPath)} variant="primary">
            Log in
          </CTALinkOrButton>
        )}
      />
    );
  }

  return <CertificateCardAuthed courseId={courseId} />;
};

type CongratulationsProps = {
  courseTitle: string;
  coursePath: string;
  courseId?: string;
  text?: string;
  className?: string;
};

const Congratulations: React.FC<CongratulationsProps> = ({
  courseTitle,
  coursePath,
  courseId,
  text,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const courseUrl = `${SITE_URL}${coursePath}`;
  const shareText = text ?? `🎉 I just completed the ${courseTitle} course from BlueDot Impact! It's free, self-paced, and packed with insights. Check it out:`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${courseUrl}`)}`;
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${courseUrl}`)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText} ${courseUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('congratulations flex flex-col gap-16', className)}>
      <div className="flex flex-col gap-6 items-center text-center max-w-[640px] mx-auto">
        <H2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.015em]">
          Hooray! You just finished the {courseTitle} course 🎉
        </H2>
        <P className="text-[16px] leading-[1.6] tracking-[-0.002em]">
          Well done! Before you venture out contributing to safe AI, we'd like to ask you
          for a favor: Please share your experience with your friends and network. This
          helps us immensely to raise awareness further and ensure making AI go well.
        </P>
      </div>

      <div className="flex flex-col gap-12">
        <ActionCard
          number={1}
          title="Share your accomplishment"
          description="Raise awareness for safe AI within your network. This will only take 1 min of your time, but can have significant impact on more people working on making AI go well. We're counting on you!"
          actions={(
            <>
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className={secondaryBtnClass}>
                <FaLinkedinIn className="size-4" />
                Share on LinkedIn
              </a>
              <a href={xUrl} target="_blank" rel="noopener noreferrer" className={secondaryBtnClass}>
                <FaXTwitter className="size-4" />
                Share on X
              </a>
            </>
          )}
        />

        <ActionCard
          number={2}
          title="Send it to someone personally"
          description={'Think of three people who\'d genuinely benefit from this course. A little "I thought of you" goes a long way. Is there anyone that comes to mind?'}
          actions={(
            <>
              <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className={secondaryBtnClass}>
                <FaWhatsapp className="size-4" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(secondaryBtnClass, 'border-0 cursor-pointer')}
              >
                <FaCopy className="size-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </>
          )}
        />

        {courseId && <CertificateCard courseId={courseId} />}

        {courseId === FOAI_COURSE_ID && (
          <div className="bg-white border-[0.5px] border-[rgba(19,19,46,0.25)] rounded-[10px] p-10 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-[18px] leading-[1.4] text-bluedot-navy">Want to go deeper?</h3>
              <P className="text-[16px] leading-[1.6] tracking-[-0.002em] text-bluedot-navy">
                <span className="font-semibold">The AGI Strategy course</span> is the natural next step: 25 hours, facilitated in small groups with live discussion. No specific background required. New rounds start every month.
              </P>
            </div>
            <CTALinkOrButton url="/courses/agi-strategy" variant="primary" withChevron>
              Apply now
            </CTALinkOrButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Congratulations;
