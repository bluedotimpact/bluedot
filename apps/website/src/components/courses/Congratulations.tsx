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
  FaCopy, FaLink, FaLinkedinIn, FaXTwitter,
} from 'react-icons/fa6';
import { COURSE_CONFIG, FOAI_COURSE_ID } from '../../lib/constants';
import { ROUTES } from '../../lib/routes';
import { getCourseCtaColors } from '../../lib/courseCtaColors';
import type { CertificateStatus } from '../../server/routers/certificates';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { trpc } from '../../utils/trpc';
import { CertificateCard } from '../certificate/CertificateCard';
import { LaurelWreathIcon } from '../icons/LaurelWreathIcon';
import { CourseIcon } from './CourseIcon';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

export const CERTIFICATE_STATUS_DESCRIPTIONS: Record<CertificateStatus, string> = {
  'action-plan-pending': 'To receive your certificate, you need to submit an action plan/project and can\'t have missed more than one discussion.',
  'can-request': 'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
  'facilitator-pending': 'Your certificate will be issued after your cohort ends, based on attendance.',
  'has-certificate': '',
  'not-eligible': 'This course doesn\'t currently issue certificates to independent learners. Join a facilitated version to get a certificate.',
};

// --- Laurel wreath ---

const LaurelWreath = ({ courseSlug }: { courseSlug: string }) => {
  const config = COURSE_CONFIG[courseSlug];
  const accentColor = config?.accentColor ?? '#94a3b8';

  return (
    <div className="relative flex items-center justify-center w-[255px] h-[174px]" style={{ color: accentColor }}>
      <LaurelWreathIcon className="absolute inset-0" aria-hidden="true" />
      <CourseIcon courseSlug={courseSlug} size="xlarge" className="relative -translate-y-6 shadow-md" />
    </div>
  );
};

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
      onError={(e) => {
        (e.target as HTMLImageElement).src = `${SITE_URL}/images/logo/link-preview-fallback.png`;
      }}
    />
  </div>
);

const ChatPreviewPanel = ({ courseTitle, courseUrl }: {
  courseTitle: string;
  courseUrl: string;
}) => (
  <div className="h-full flex flex-col items-center justify-center p-8 bg-[#fbfbfd] border-l border-[#e5e9f2]">
    <div className="bg-bluedot-normal rounded-[7.5px] shadow-sm px-4 py-3 max-w-[280px]">
      <p className="text-[14px] leading-[20px] text-white">
        Hey, I just finished this free {courseTitle} course and it genuinely shifted how I
        think about this stuff. Thought you&rsquo;d find it interesting as well.
        <br />
        <span className="underline tracking-[0.16px]">{courseUrl}</span>
      </p>
      <p className="text-[12px] text-white/60 text-right mt-1">19:45</p>
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

const ShareCard = ({
  title, description, actions, preview,
}: ShareCardProps) => (
  <div className="bg-white border-[0.5px] border-[rgba(19,19,46,0.25)] rounded-[10px] overflow-hidden flex flex-col md:flex-row md:min-h-[327px]">
    <div className="flex flex-col p-6 md:px-[40px] md:py-[32px] md:w-1/2 gap-[32px]">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-[20px] leading-[1.4] text-bluedot-navy">{title}</h3>
        {description && <P className="text-[16px] leading-[1.6] tracking-[-0.032px] text-bluedot-navy">{description}</P>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
    {preview && (
      <div className="w-full md:w-1/2 overflow-hidden">
        {preview}
      </div>
    )}
  </div>
);

const primaryBtnClass
  = 'flex items-center justify-center gap-3 bg-bluedot-normal text-white rounded-[6px] px-4 py-3 text-[14px] font-semibold tracking-[-0.35px] hover:opacity-90 transition-opacity no-underline whitespace-nowrap cursor-pointer';

const outlinedBtnClass
  = 'flex items-center justify-center gap-2.5 bg-white border border-[rgba(106,111,122,0.5)] text-bluedot-navy rounded-[6px] px-4 py-3 text-[14px] font-medium hover:bg-slate-50 transition-colors no-underline whitespace-nowrap cursor-pointer';

// --- Certificate hero ---

type CertificateHeroProps = { courseId: string; courseTitle: string };

const CertificateHeroAuthed = ({ courseId, courseTitle }: CertificateHeroProps) => {
  const { data, isLoading, error } = trpc.certificates.getStatus.useQuery({ courseId });
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-12"><ProgressDots /></div>;
  }

  if (error != null) {
    return <ErrorView error={error} />;
  }

  if (data?.status !== 'has-certificate') {
    return null;
  }

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
    <div className="flex flex-col items-center gap-6 w-full">
      <CertificateCard
        courseName={data.courseName ?? courseTitle}
        courseSlug={data.courseSlug}
        recipientName={data.recipientName}
        description={data.certificationDescription}
        issuedDate={issuedDate}
        certificateId={data.certificateId}
      />
      <button
        type="button"
        onClick={handleCopyLink}
        className={outlinedBtnClass}
      >
        <FaLink className="size-4" />
        {copied ? 'Link copied!' : 'Copy link'}
      </button>
    </div>
  );
};

const CertificateHero = ({ courseId, courseTitle }: CertificateHeroProps) => {
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  if (!auth) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-[14px] text-[#62748E] text-center max-w-[480px]">
          Create a free account to earn your course certificate.
        </p>
        <CTALinkOrButton url={getLoginUrl(router.asPath)} variant="primary">
          Log in
        </CTALinkOrButton>
      </div>
    );
  }

  return <CertificateHeroAuthed courseId={courseId} courseTitle={courseTitle} />;
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
  const shareText = text ?? `I just completed the ${courseTitle} course from BlueDot Impact! It's free, self-paced, and packed with insights. Check it out:`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${courseUrl}`)}`;
  const courseColors = getCourseCtaColors(courseSlug);

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
      <div className="flex flex-col items-center pt-12 pb-16 gap-8">
        <LaurelWreath courseSlug={courseSlug} />
        <H2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.015em] max-w-[720px] text-center">
          Congratulations on finishing the {courseTitle} course!
        </H2>
        {courseId && (
          <CertificateHero courseId={courseId} courseTitle={courseTitle} />
        )}
      </div>

      {/* Sharing section with course-colored gradient (inset rounded card) */}
      <div className="pb-12 w-full max-w-[964px] mx-auto">
        <div
          className="flex flex-col items-center px-5 md:px-[54px] py-[64px] gap-12 rounded-[17px] overflow-hidden"
          style={{ background: courseColors.gradient }}
        >
          <div className="flex flex-col items-center text-center gap-4 max-w-[653px]">
            <p
              className="text-[16px] font-semibold uppercase tracking-[0.04em]"
              style={{ color: courseColors.accent }}
            >
              Start making impact today
            </p>
            <H2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.015em] text-white">
              Help more people discover AI safety today
            </H2>
            <P className="text-[16px] leading-[1.6] tracking-[-0.002em] text-white">
              You&apos;ve spent time understanding one of the most important problems of our era.
              A post or a message to the right person can have a real ripple effect.
            </P>
          </div>

          <div className="flex flex-col gap-8 w-full">
            <ShareCard
              title="1. Share with your network"
              description="Take a minute to celebrate and raise awareness for safe AI in your network!"
              preview={<PostPreviewPanel courseSlug={courseSlug} shareText={shareText} courseUrl={courseUrl} />}
              actions={(
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
              )}
            />

            <ShareCard
              title="2. Refer a friend or colleague"
              description={'Think of three people who\'d genuinely benefit from this course. A little "I thought of you" goes a long way.'}
              preview={<ChatPreviewPanel courseTitle={courseTitle} courseUrl={courseUrl} />}
              actions={(
                <button type="button" onClick={handleCopyShare} className={primaryBtnClass}>
                  <FaCopy className="size-4" />
                  {copied ? 'Copied!' : 'Copy Message'}
                </button>
              )}
            />
          </div>
        </div>
      </div>

      {courseId === FOAI_COURSE_ID && (
        <div className="py-12 flex justify-center bg-white">
          <div className="bg-white border-hairline border-bluedot-navy/25 rounded-[10px] p-10 flex flex-col gap-6 w-full max-w-[1100px]">
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
        </div>
      )}
    </div>
  );
};

export default Congratulations;
