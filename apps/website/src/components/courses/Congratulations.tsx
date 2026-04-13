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
import { COURSE_CONFIG, FOAI_COURSE_ID } from '../../lib/constants';
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
  = 'flex flex-1 items-center justify-center gap-2 bg-bluedot-navy/5 rounded-[5px] px-4 py-[7px] text-[13px] font-medium text-bluedot-navy/80 hover:bg-bluedot-navy/10 transition-colors no-underline whitespace-nowrap';

// --- Preview panels ---

const PostPreviewPanel = ({ courseSlug, shareText, courseUrl }: {
  courseSlug: string;
  shareText: string;
  courseUrl: string;
}) => (
  <div className="h-full bg-[#fbfbfd] border-t border-[#e5e9f2] md:border-t-0 md:border-l flex flex-col p-5 gap-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-bluedot-navy/40">
      Post Preview
    </p>
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-full bg-bluedot-navy/10 shrink-0" />
      <div className="flex flex-col gap-1">
        <div className="h-2.5 w-24 rounded-full bg-bluedot-navy/15" />
        <div className="h-2.5 w-14 rounded-full bg-bluedot-navy/15" />
      </div>
    </div>
    <p className="text-[13px] leading-[1.5] text-bluedot-navy line-clamp-3">
      {shareText}{' '}
      <span className="text-blue-600">{courseUrl}</span>
    </p>
    <img
      src={`/images/courses/link-preview/${courseSlug}.png`}
      alt=""
      className="w-full rounded-lg object-cover"
    />
  </div>
);

const WhatsAppPreviewPanel = ({ courseTitle, courseUrl }: {
  courseTitle: string;
  courseUrl: string;
}) => (
  <div className="h-full flex flex-col items-center justify-center p-8" style={{ backgroundImage: 'url(/images/whatsapp-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <div className="bg-[#d9fdd3] rounded-[7.5px] shadow-sm px-3 py-2.5 max-w-[280px]">
      <p className="text-[13px] leading-[1.5] text-[#0a0a0a]">
        Hey, I just finished this {courseTitle} course and it genuinely shifted how I
        think about this stuff. It&apos;s free and self-paced.{' '}
        <span className="text-[#1b8755] underline">{courseUrl}</span>
      </p>
      <p className="text-[11px] text-black/40 text-right mt-1">19:45 ✓✓</p>
    </div>
  </div>
);

const CertificatePreviewPanel = ({ courseSlug, courseTitle, holderName }: {
  courseSlug: string;
  courseTitle: string;
  holderName?: string;
}) => {
  const badgeSrc = courseSlug in COURSE_CONFIG
    ? `/images/certificates/${courseSlug}.png`
    : '/images/certificates/certificate-fallback-image.png';

  return (
    <div className="h-full bg-[#f7f7fd] flex items-center justify-center p-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm w-full max-w-[360px] overflow-hidden">
        <div className="flex flex-col items-center px-6 py-8 gap-4">
          <img src={badgeSrc} alt="" className="h-[140px] w-auto object-contain" />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#62748E]">
              Professional Certification
            </p>
            <p className="text-[18px] font-semibold text-bluedot-navy leading-tight">
              {courseTitle}
            </p>
          </div>
          {holderName && (
            <div className="flex flex-col items-center gap-0.5 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#62748E]">
                Awarded to
              </p>
              <p className="text-[14px] font-semibold text-bluedot-navy">{holderName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- ActionCard ---

type ActionCardProps = {
  number: number;
  title: string;
  description: string;
  actions: React.ReactNode;
  preview?: React.ReactNode;
};

const ActionCard = ({
  number, title, description, actions, preview,
}: ActionCardProps) => (
  <div className="bg-white border-hairline border-bluedot-navy/25 rounded-[10px] overflow-hidden flex flex-col md:flex-row md:min-h-[400px]">
    <div className="flex flex-col justify-between p-6 md:py-10 md:px-16 md:w-1/2">
      <div className="flex flex-col gap-6">
        <div className="border-2 border-bluedot-navy/8 rounded-[12px] size-16 flex items-center justify-center shrink-0">
          <span className="font-bold text-[32px] leading-[1.3] tracking-[-0.015em] text-bluedot-navy">
            {number}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-[18px] leading-[1.4] text-bluedot-navy">{title}</h3>
          {description && <P className="text-[16px] leading-[1.6] tracking-[-0.002em] text-bluedot-navy">{description}</P>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 mt-6">{actions}</div>}
    </div>
    {preview && (
      <div className="w-full md:w-1/2 overflow-hidden">
        {preview}
      </div>
    )}
  </div>
);

// --- Certificate card ---

type CertificateCardProps = { courseId: string; courseSlug: string; courseTitle: string };

const CertificateCardAuthed = ({ courseId, courseSlug, courseTitle }: CertificateCardProps) => {
  const { data: certificateData, isLoading, error, refetch } = trpc.certificates.getStatus.useQuery({ courseId });

  const requestCertificateMutation = trpc.certificates.request.useMutation({
    onSuccess: async () => {
      await refetch();
      if (typeof window !== 'undefined' && window.dataLayer && courseId === FOAI_COURSE_ID) {
        window.dataLayer.push({ event: 'completers', course_slug: 'future-of-ai' });
      }
    },
  });

  const preview = <CertificatePreviewPanel courseSlug={courseSlug} courseTitle={courseTitle} />;

  if (isLoading || requestCertificateMutation.isPending) {
    return (
      <ActionCard number={3} title="Grab your certificate" description="" actions={<ProgressDots />} preview={preview} />
    );
  }

  if (error != null || requestCertificateMutation.isError) {
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description=""
        preview={preview}
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
        preview={<CertificatePreviewPanel courseSlug={courseSlug} courseTitle={courseTitle} holderName={certificateData.holderName} />}
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
        preview={preview}
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
        preview={preview}
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
        preview={preview}
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
      preview={preview}
      actions={null}
    />
  );
};

const CertificateCard = ({ courseId, courseSlug, courseTitle }: CertificateCardProps) => {
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  if (!auth) {
    return (
      <ActionCard
        number={3}
        title="Grab your certificate"
        description="Create a free account to earn your course certificate."
        preview={<CertificatePreviewPanel courseSlug={courseSlug} courseTitle={courseTitle} />}
        actions={(
          <CTALinkOrButton url={getLoginUrl(router.asPath)} variant="primary">
            Log in
          </CTALinkOrButton>
        )}
      />
    );
  }

  return <CertificateCardAuthed courseId={courseId} courseSlug={courseSlug} courseTitle={courseTitle} />;
};

// --- Main component ---

type CongratulationsProps = {
  courseTitle: string;
  coursePath: string;
  courseSlug: string;
  courseId?: string;
  text?: string;
  className?: string;
};

const Congratulations: React.FC<CongratulationsProps> = ({
  courseTitle,
  coursePath,
  courseSlug,
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
    <div className={cn('congratulations flex flex-col gap-16 max-w-[1100px] mx-auto w-full', className)}>
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
          preview={<PostPreviewPanel courseSlug={courseSlug} shareText={shareText} courseUrl={courseUrl} />}
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
          preview={<WhatsAppPreviewPanel courseTitle={courseTitle} courseUrl={courseUrl} />}
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

        {courseId && <CertificateCard courseId={courseId} courseSlug={courseSlug} courseTitle={courseTitle} />}

        {courseId === FOAI_COURSE_ID && (
          <div className="bg-white border-hairline border-bluedot-navy/25 rounded-[10px] p-10 flex flex-col gap-6">
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
