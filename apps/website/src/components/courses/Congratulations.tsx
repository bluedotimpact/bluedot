import {
  addQueryParam, cn, CTALinkOrButton, H2, P, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
import type React from 'react';
import { useState } from 'react';
import {
  FaCopy, FaLink, FaLinkedinIn, FaXTwitter,
} from 'react-icons/fa6';
import { COURSE_CONFIG, FOAI_COURSE_ID } from '../../lib/constants';
import { getCourseCtaColours } from '../../lib/courseCtaColours';
import { ROUTES } from '../../lib/routes';
import { getActionPlanUrl } from '../../lib/utils';
import type { CertificateStatus } from '../../server/routers/certificates';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { trpc } from '../../utils/trpc';
import { CertificateCard } from '../certificate/CertificateCard';
import { LaurelWreathIcon } from '../icons/LaurelWreathIcon';
import { CourseIcon } from './CourseIcon';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

export const CERTIFICATE_STATUS_DESCRIPTIONS: Record<CertificateStatus, string> = {
  'action-plan-pending':
    'To receive your certificate, you need to submit an action plan/project and can\'t have missed more than one discussion.',
  'attendance-ineligible':
    'You missed too many discussions to be eligible for a certificate. Participants can miss at most one discussion.',
  'can-request': 'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
  'facilitator-pending': 'Your certificate will be issued after your cohort ends, based on attendance.',
  'has-certificate': '',
  'not-eligible':
    'This course doesn\'t currently issue certificates to independent learners. Join a facilitated version to get a certificate.',
};

// --- Laurel wreath ---

const LaurelWreath = ({ courseSlug }: { courseSlug: string }) => {
  const config = COURSE_CONFIG[courseSlug];
  const accentColor = config?.accentColor ?? '#94a3b8';

  return (
    <div className="relative flex h-[174px] w-[255px] items-center justify-center" style={{ color: accentColor }}>
      <LaurelWreathIcon className="absolute inset-0" aria-hidden="true" />
      <CourseIcon courseSlug={courseSlug} size="xlarge" className="relative -translate-y-6 shadow-md" />
    </div>
  );
};

// --- Preview panels ---

const PostPreviewPanel = ({
  courseSlug,
  shareText,
  courseUrl,
}: {
  courseSlug: string;
  shareText: string;
  courseUrl: string;
}) => (
  <div className="flex h-full flex-col gap-4 border-t border-[#e5e9f2] bg-[#fbfbfd] p-5 md:border-t-0 md:border-l">
    <p className="text-bluedot-navy/40 text-[11px] font-semibold tracking-[0.04em] uppercase">Post Preview</p>
    <div className="flex items-center gap-3">
      <div className="bg-bluedot-navy/10 size-8 shrink-0 rounded-full" />
      <div className="flex flex-col gap-1">
        <div className="bg-bluedot-navy/15 h-2.5 w-24 rounded-full" />
        <div className="bg-bluedot-navy/15 h-2.5 w-14 rounded-full" />
      </div>
    </div>
    <p className="text-bluedot-navy line-clamp-3 text-[13px] leading-[1.5]">
      {shareText} <span className="text-blue-600">{courseUrl}</span>
    </p>
    <img
      src={`/images/courses/link-preview/${courseSlug}.png`}
      alt=""
      className="w-full rounded-lg object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).src = `${SITE_URL}/images/logo/link-preview-fallback.png`;
      }}
    />
  </div>
);

const ChatPreviewPanel = ({ courseTitle, courseUrl }: { courseTitle: string; courseUrl: string }) => (
  <div className="flex h-full flex-col items-center justify-center border-l border-[#e5e9f2] bg-[#fbfbfd] p-8">
    <div className="bg-bluedot-normal relative max-w-[280px] rounded-[7.5px] px-4 py-3 shadow-sm">
      <p className="text-[14px] leading-[20px] text-white">
        Hey, I just finished this free {courseTitle} course and it genuinely shifted how I think about this stuff.
        Thought you&rsquo;d find it interesting as well.
        <br />
        <span className="tracking-[0.16px] underline">{courseUrl}</span>
      </p>
      <p className="mt-1 text-right text-[12px] text-white/60">19:45</p>
      <svg
        className="text-bluedot-normal absolute"
        style={{ right: '5px', bottom: '-8.917px' }}
        width="15"
        height="13"
        viewBox="0 0 15 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10.5266 0H1.97356C0.26132 0 -0.640961 2.01068 0.527016 3.26271C12.8436 16.4658 16.2185 12.8421 13.9392 11.5753C12.2434 10.6329 12.7191 5.20631 12.3495 1.55509C12.2564 0.634952 11.4514 0 10.5266 0Z"
          fill="currentColor"
        />
      </svg>
    </div>
  </div>
);

// --- ShareCard ---

type ShareCardProps = {
  title: string;
  description: string;
  actions: React.ReactNode;
  preview?: React.ReactNode;
};

const ShareCard = ({ title, description, actions, preview }: ShareCardProps) => (
  <div className="flex flex-col overflow-hidden rounded-[10px] border-[0.5px] border-[rgba(19,19,46,0.25)] bg-white md:min-h-[327px] md:flex-row">
    <div className="flex flex-col gap-[32px] p-6 md:w-1/2 md:px-[40px] md:py-[32px]">
      <div className="flex flex-col gap-3">
        <h3 className="text-bluedot-navy text-[20px] leading-[1.4] font-semibold">{title}</h3>
        {description && (
          <P className="text-bluedot-navy text-[16px] leading-[1.6] tracking-[-0.032px]">{description}</P>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
    {preview && <div className="w-full overflow-hidden md:w-1/2">{preview}</div>}
  </div>
);

const primaryBtnClass
  = 'flex items-center justify-center gap-3 bg-bluedot-normal text-white rounded-[6px] px-4 py-3 text-[14px] font-semibold tracking-[-0.35px] hover:opacity-90 transition-opacity no-underline whitespace-nowrap cursor-pointer';

const outlinedBtnClass
  = 'flex items-center justify-center gap-2.5 bg-white border border-[rgba(106,111,122,0.5)] text-bluedot-navy rounded-[6px] px-4 py-3 text-[14px] font-medium hover:bg-slate-50 transition-colors no-underline whitespace-nowrap cursor-pointer';

// --- Certificate hero ---

type CertificateHeroProps = { courseId: string; courseSlug: string; courseTitle: string };

const CertificatePreviewCard = ({ courseSlug, courseTitle }: { courseSlug: string; courseTitle: string }) => {
  const badgeSrc
    = courseSlug in COURSE_CONFIG
      ? `/images/certificates/${courseSlug}.png`
      : '/images/certificates/certificate-fallback-image.png';

  return (
    <div className="flex w-full max-w-[640px] flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white px-6 py-10 shadow-sm">
      <img src={badgeSrc} alt="" className="h-[160px] w-auto object-contain" />
      <p className="text-[11px] font-medium tracking-[0.06em] text-[#62748E] uppercase">Professional Certification</p>
      <p className="text-bluedot-navy text-center text-[28px] leading-tight font-semibold">{courseTitle}</p>
    </div>
  );
};

const CertificateHeroAuthed = ({ courseId, courseSlug, courseTitle }: CertificateHeroProps) => {
  const { data, isLoading, error, refetch } = trpc.certificates.getStatus.useQuery({ courseId });
  const [copied, setCopied] = useState(false);

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
      <div className="flex justify-center py-12">
        <ProgressDots />
      </div>
    );
  }

  if (error != null || requestCertificateMutation.isError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <ErrorView error={error ?? requestCertificateMutation.error} />
        <CTALinkOrButton
          variant="primary"
          onClick={() => (error ? refetch() : requestCertificateMutation.mutate({ courseId }))}
        >
          Retry
        </CTALinkOrButton>
      </div>
    );
  }

  if (data?.status === 'has-certificate') {
    const issuedDate = new Date(data.certificateCreatedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const certificateLink = `${SITE_URL}${addQueryParam(ROUTES.certification.url, 'id', data.certificateId)}`;

    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(certificateLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_error) {
        // Clipboard API unavailable
      }
    };

    return (
      <div className="flex w-full flex-col items-center gap-6">
        <CertificateCard
          courseName={data.courseName ?? courseTitle}
          courseSlug={data.courseSlug}
          recipientName={data.recipientName}
          description={data.certificationDescription}
          issuedDate={issuedDate}
          certificateId={data.certificateId}
        />
        <button type="button" onClick={handleCopyLink} className={outlinedBtnClass}>
          <FaLink className="size-4" />
          {copied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>
    );
  }

  // `not-eligible` is dead in practice here: `CourseCompletionSection` only renders
  // `Congratulations` once the user is enrolled (past the rounds/apply gate), so
  // unenrolled users never reach this hero. Kept as a defensive fallback.
  const description = data?.status ? CERTIFICATE_STATUS_DESCRIPTIONS[data.status] : null;

  let cta: React.ReactNode = null;
  if (data?.status === 'can-request') {
    cta = (
      <CTALinkOrButton variant="primary" onClick={() => requestCertificateMutation.mutate({ courseId })}>
        Download Certificate
      </CTALinkOrButton>
    );
  } else if (data?.status === 'action-plan-pending') {
    const actionPlanUrl = getActionPlanUrl(data.meetPersonId);
    cta = (
      <CTALinkOrButton
        url={actionPlanUrl}
        variant="primary"
        target="_blank"
        disabled={data.hasSubmittedActionPlan ?? false}
      >
        {data.hasSubmittedActionPlan ? 'Submitted!' : 'Submit your plan here'}
      </CTALinkOrButton>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <CertificatePreviewCard courseSlug={courseSlug} courseTitle={courseTitle} />
      {description && <p className="max-w-[480px] text-center text-[14px] text-[#62748E]">{description}</p>}
      {cta}
    </div>
  );
};

const CertificateHero = ({ courseId, courseSlug, courseTitle }: CertificateHeroProps) => {
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  if (!auth) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <CertificatePreviewCard courseSlug={courseSlug} courseTitle={courseTitle} />
        <p className="max-w-[480px] text-center text-[14px] text-[#62748E]">
          Create a free account to earn your course certificate.
        </p>
        <CTALinkOrButton url={getLoginUrl(router.asPath)} variant="primary">
          Log in
        </CTALinkOrButton>
      </div>
    );
  }

  return <CertificateHeroAuthed courseId={courseId} courseSlug={courseSlug} courseTitle={courseTitle} />;
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
  const shareText
    = text
      ?? `I just completed the ${courseTitle} course from BlueDot Impact! It's free, self-paced, and packed with insights. Check it out:`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${courseUrl}`)}`;
  const courseColors = getCourseCtaColours(courseSlug);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${courseUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      // Clipboard API unavailable
    }
  };

  return (
    <div className={cn('congratulations flex flex-col bg-white', className)}>
      {/* Certificate hero section */}
      <div className="flex flex-col items-center gap-8 pt-12 pb-16">
        <LaurelWreath courseSlug={courseSlug} />
        <H2 className="max-w-[720px] text-center text-[32px] leading-[1.3] font-bold tracking-[-0.015em]">
          Congratulations on finishing the {courseTitle} course!
        </H2>
        {courseId && <CertificateHero courseId={courseId} courseSlug={courseSlug} courseTitle={courseTitle} />}
      </div>

      {/* Sharing section with course-colored gradient (inset rounded card) */}
      <div className="mx-auto w-full max-w-[964px] pb-12">
        <div
          className="flex flex-col items-center gap-12 overflow-hidden rounded-[17px] px-5 py-[64px] md:px-[54px]"
          style={{ background: courseColors.gradient }}
        >
          <div className="flex max-w-[653px] flex-col items-center gap-4 text-center">
            <p className="text-[16px] font-semibold tracking-[0.04em] uppercase" style={{ color: courseColors.accent }}>
              Start making impact today
            </p>
            <H2 className="text-[32px] leading-[1.3] font-bold tracking-[-0.015em] text-white">
              Help more people discover AI safety today
            </H2>
            <P className="text-[16px] leading-[1.6] tracking-[-0.002em] text-white">
              You&apos;ve spent time understanding one of the most important problems of our era. A post or a message to
              the right person can have a real ripple effect.
            </P>
          </div>

          <div className="flex w-full flex-col gap-8">
            <ShareCard
              title="1. Share with your network"
              description="Take a minute to celebrate and raise awareness for safe AI in your network!"
              preview={<PostPreviewPanel courseSlug={courseSlug} shareText={shareText} courseUrl={courseUrl} />}
              actions={
                <>
                  <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className={primaryBtnClass}>
                    <FaLinkedinIn className="size-4" />
                    Share on LinkedIn
                  </a>
                  <a href={xUrl} target="_blank" rel="noopener noreferrer" className={outlinedBtnClass}>
                    <FaXTwitter className="size-4" />
                    Share on X
                  </a>
                </>
              }
            />

            <ShareCard
              title="2. Refer a friend or colleague"
              description={
                'Think of three people who\'d genuinely benefit from this course. A little "I thought of you" goes a long way.'
              }
              preview={<ChatPreviewPanel courseTitle={courseTitle} courseUrl={courseUrl} />}
              actions={
                <button type="button" onClick={handleCopyShare} className={primaryBtnClass}>
                  <FaCopy className="size-4" />
                  {copied ? 'Copied!' : 'Copy Message'}
                </button>
              }
            />
          </div>
        </div>
      </div>

      {courseId === FOAI_COURSE_ID && (
        <div className="flex justify-center bg-white py-12">
          <div className="border-hairline border-bluedot-navy/25 flex w-full max-w-[1100px] flex-col gap-6 rounded-[10px] bg-white p-10">
            <div className="flex flex-col gap-3">
              <h3 className="text-bluedot-navy text-[18px] leading-[1.4] font-semibold">Want to go deeper?</h3>
              <P className="text-bluedot-navy text-[16px] leading-[1.6] tracking-[-0.002em]">
                <span className="font-semibold">The AGI Strategy course</span> is the natural next step: 25 hours,
                facilitated in small groups with live discussion. No specific background required. New rounds start
                every month.
              </P>
            </div>
            <CTALinkOrButton url="/courses/agi-strategy" variant="primary" withChevron>
              Apply now
            </CTALinkOrButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default Congratulations;
