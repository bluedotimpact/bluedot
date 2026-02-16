import { courseRegistrationTable, courseTable } from '@bluedot/db';
import {
  Breadcrumbs,
  type BluedotRoute,
  CTALinkOrButton,
  ClickTarget,
  Footer,
  H1,
  P,
  Section,
  useAuthStore,
} from '@bluedot/ui';
import clsx from 'clsx';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import path from 'path';
import Confetti from 'react-confetti';
import { FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { Nav } from '../components/Nav/Nav';
import { trpc } from '../utils/trpc';
import db from '../lib/api/db';
import { ROUTES } from '../lib/routes';
import { getCourseRoundsData } from '../server/routers/course-rounds';
import { fileExists } from '../utils/fileExists';
import { CertificateCard } from '../components/certificate/CertificateCard';
import { CertificateCTA } from '../components/certificate/CertificateCTA';
import { FOAI_COLORS } from '../components/lander/course-content/FutureOfAiContent';
import { AGI_STRATEGY_COLORS } from '../components/lander/course-content/AgiStrategyContent';
import { TAS_COLORS } from '../components/lander/course-content/TechnicalAiSafetyContent';
import { AI_GOVERNANCE_COLORS } from '../components/lander/course-content/AiGovernanceContent';
import { BIOSECURITY_COLORS } from '../components/lander/course-content/BioSecurityContent';

type Certificate = {
  certificateId: string;
  certificateCreatedAt: number;
  recipientName: string;
  courseName: string;
  courseSlug: string;
  certificationDescription: string;
  courseDetailsUrl: string;
};

async function getCertificateData(certificateId: string) {
  const courseRegistration = await db.get(courseRegistrationTable, { certificateId });
  const course = await db.get(courseTable, { id: courseRegistration.courseId });

  const certificate: Certificate = {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Date.now() / 1000,
    recipientName: courseRegistration.fullName,
    courseName: course.title,
    courseSlug: course.slug,
    courseDetailsUrl: course.detailsUrl,
    certificationDescription: course.certificationDescription || '',
  };

  return certificate;
}

type CertificatePageProps = {
  certificate: Certificate | null;
  certificateId: string | null;
  linkPreviewFilename: string;
  nextCohortText: string | null;
};

const DEFAULT_CTA_COLORS = {
  gradient: 'linear-gradient(to right, rgba(26, 26, 46, 0.6) 0%, transparent 60%), #1a1a2e',
  accent: '#94a3b8',
};

const COURSE_COLOR_MAP: Record<string, { gradient: string; accent: string }> = {
  'future-of-ai': FOAI_COLORS,
  'agi-strategy': AGI_STRATEGY_COLORS,
  'technical-ai-safety': TAS_COLORS,
  'ai-governance': AI_GOVERNANCE_COLORS,
  biosecurity: BIOSECURITY_COLORS,
};

const getCourseCtaColors = (courseSlug: string): { gradient: string; accent: string } => {
  return COURSE_COLOR_MAP[courseSlug] || DEFAULT_CTA_COLORS;
};

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatCohortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const ordinal = getOrdinalSuffix(day);
  return `${month} ${day}${ordinal}`;
};

const ShareButtons: React.FC<{ shareUrl: string; shareText: string }> = ({ shareUrl, shareText }) => {
  const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const xUrl = `https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const baseButtonClasses = 'h-10 px-4 py-[7px] rounded-[5px] flex items-center justify-center gap-2 font-medium text-[13px] leading-[22px] transition-opacity hover:opacity-90';

  return (
    <div className="flex flex-col sm:flex-row gap-2 justify-center">
      <ClickTarget
        url={linkedInUrl}
        target="_blank"
        className={clsx(baseButtonClasses, 'bg-[#1144cc] text-white w-full sm:w-auto')}
        aria-label="Share on LinkedIn"
      >
        <FaLinkedin size={16} />
        <span>Share on LinkedIn</span>
      </ClickTarget>

      <ClickTarget
        url={xUrl}
        target="_blank"
        className={clsx(baseButtonClasses, 'bg-bluedot-navy/5 text-bluedot-navy w-full sm:w-auto')}
        aria-label="Share on X"
      >
        <FaXTwitter size={16} />
        <span>Share on X</span>
      </ClickTarget>
    </div>
  );
};

const CertificatePage = ({
  certificate, certificateId, linkPreviewFilename, nextCohortText,
}: CertificatePageProps) => {
  const auth = useAuthStore((s) => s.auth);
  const { data: ownershipData } = trpc.certificates.verifyOwnership.useQuery(
    { certificateId: certificateId! },
    { enabled: !!auth && !!certificateId },
  );
  const isOwner = ownershipData?.isOwner ?? false;

  if (!certificateId) {
    return (
      <main className="bluedot-base flex flex-col">
        <Nav />
        <Section className="flex-1">
          <div className="flex flex-col gap-4 mt-4">
            <H1>Missing certificate id</H1>
            <P>Check the link you were sent and try again.</P>
            <div className="flex flex-row gap-4">
              <CTALinkOrButton url={ROUTES.courses.url}>Back to Courses</CTALinkOrButton>
              <CTALinkOrButton url={ROUTES.contact.url} variant="secondary">Contact us</CTALinkOrButton>
            </div>
          </div>
        </Section>
        <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="bluedot-base flex flex-col">
        <Nav />
        <Section className="flex-1">
          <div className="flex flex-col gap-4 mt-4">
            <H1>Certificate not found</H1>
            <P>We couldn't find the certificate you're looking for.</P>
            <div className="flex flex-row gap-4">
              <CTALinkOrButton url={ROUTES.courses.url}>Back to Courses</CTALinkOrButton>
              <CTALinkOrButton url={ROUTES.contact.url} variant="secondary">Contact us</CTALinkOrButton>
            </div>
          </div>
        </Section>
        <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
      </main>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org';
  const linkPreviewAbsoluteUrl = `${siteUrl}/images/certificates/link-preview/${linkPreviewFilename}`;
  const shareUrl = `${siteUrl}/certification?id=${certificate.certificateId}`;
  const shareText = `I've completed ${certificate.courseName} with BlueDot Impact!`;
  const courseColors = getCourseCtaColors(certificate.courseSlug);

  const certificateRoute: BluedotRoute = {
    title: `${certificate.courseName} Certificate`,
    url: `/certification?id=${certificateId}`,
    parentPages: [
      { title: 'Home', url: '/' },
      { title: 'Settings', url: '/settings' },
      { title: 'My Courses', url: '/settings/courses' },
    ],
  };

  const issuedDate = new Date(certificate.certificateCreatedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="bluedot-base flex flex-col">
      <Nav />
      <Head>
        <title>{`${certificate.recipientName} has completed ${certificate.courseName} | BlueDot Impact`}</title>
        <meta name="description" content={certificate.certificationDescription || `Certificate of completion for ${certificate.courseName}`} />
        <meta name="robots" content="noindex" />

        <meta property="og:title" content={`${certificate.recipientName} has completed the ${certificate.courseName} course`} />
        <meta property="og:description" content={certificate.certificationDescription || `Certificate of completion for ${certificate.courseName}`} />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${siteUrl}/certification?id=${encodeURIComponent(certificateId)}`} />
        <meta property="og:image" content={linkPreviewAbsoluteUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content={`${certificate.courseName} certification badge`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${certificate.recipientName} has completed the ${certificate.courseName} course`} />
        <meta name="twitter:description" content={certificate.certificationDescription || `Certificate of completion for ${certificate.courseName}`} />
        <meta name="twitter:image" content={linkPreviewAbsoluteUrl} />
      </Head>

      {isOwner && (
        <div className="hidden md:block">
          <Breadcrumbs
            route={certificateRoute}
            className="text-[13px] leading-[1.4] tracking-[-0.065px]"
          />
        </div>
      )}

      {isOwner && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[600px] overflow-hidden pointer-events-none z-50">
          <Confetti
            width={850}
            height={600}
            numberOfPieces={200}
            recycle={false}
            colors={['#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#DBEAFE']}
          />
        </div>
      )}

      <div
        className={clsx(
          'flex-1 flex flex-col items-center px-5 md:px-0 pt-12 md:pt-20',
          isOwner ? 'pb-12 md:pb-24' : 'pb-0 md:pb-24',
        )}
      >
        <CertificateCard
          courseName={certificate.courseName}
          courseSlug={certificate.courseSlug}
          recipientName={certificate.recipientName}
          description={certificate.certificationDescription}
          issuedDate={issuedDate}
          certificateId={certificate.certificateId}
        />

        <div
          className={clsx(
            'md:max-w-[800px]',
            isOwner ? 'w-full mt-12 md:mt-20' : 'w-[calc(100%+40px)] md:w-full mt-12 md:mt-20 -mx-5 md:mx-0',
          )}
        >
          {isOwner ? (
            <div className="flex flex-col items-center gap-6">
              <ShareButtons shareUrl={shareUrl} shareText={shareText} />
              <p className="text-size-md leading-[26px] tracking-[-0.3125px] text-[#62748E] text-center">
                Celebrate your achievement by sharing it with your professional network & friends.
              </p>
            </div>
          ) : (
            <CertificateCTA
              courseName={certificate.courseName}
              courseSlug={certificate.courseSlug}
              courseUrl={certificate.courseDetailsUrl}
              nextCohortDate={nextCohortText || undefined}
              gradient={courseColors.gradient}
              accentColor={courseColors.accent}
            />
          )}
        </div>
      </div>

      <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
    </main>
  );
};

export const getServerSideProps: GetServerSideProps<CertificatePageProps> = async ({ query, res }) => {
  const certificateId = (query.id || query.r) as string | undefined;

  if (!certificateId) {
    return {
      props: {
        certificate: null,
        certificateId: null,
        linkPreviewFilename: 'link-preview-fallback.png',
        nextCohortText: null,
      },
    };
  }

  try {
    const certificate = await getCertificateData(certificateId);

    const linkPreviewFsPath = path.join(
      process.cwd(),
      'public',
      'images',
      'certificates',
      'link-preview',
      `${certificate.courseSlug}.png`,
    );
    const linkPreviewFilename = (await fileExists(linkPreviewFsPath))
      ? `${certificate.courseSlug}.png`
      : 'link-preview-fallback.png';

    // Fetch cohort data to display next cohort start date
    const rounds = await getCourseRoundsData(certificate.courseSlug);
    const allRounds = [...(rounds?.intense || []), ...(rounds?.partTime || [])];
    const now = new Date();
    const soonestRound = allRounds
      .filter((r) => r.firstDiscussionDateRaw && new Date(r.firstDiscussionDateRaw) > now)
      .sort((a, b) => new Date(a.firstDiscussionDateRaw!).getTime() - new Date(b.firstDiscussionDateRaw!).getTime())[0];

    let nextCohortText: string | null = null;
    if (certificate.courseSlug === 'future-of-ai') {
      nextCohortText = 'Start Immediately';
    } else if (soonestRound?.firstDiscussionDateRaw) {
      nextCohortText = `Next Cohort starts ${formatCohortDate(soonestRound.firstDiscussionDateRaw)}`;
    }

    res.setHeader(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=86400',
    );

    return {
      props: {
        certificate,
        certificateId,
        linkPreviewFilename,
        nextCohortText,
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching certificate:', certificateId, error);
    return {
      props: {
        certificate: null,
        certificateId,
        linkPreviewFilename: 'link-preview-fallback.png',
        nextCohortText: null,
      },
    };
  }
};

CertificatePage.rawLayout = true;

export default CertificatePage;
