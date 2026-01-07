import { courseRegistrationTable, courseTable } from '@bluedot/db';
import {
  CTALinkOrButton,
  Footer,
  H1,
  P,
  Section,
  ShareButton,
} from '@bluedot/ui';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import path from 'path';
import { FaCircleCheck } from 'react-icons/fa6';
import db from '../lib/api/db';
import { ROUTES } from '../lib/routes';
import { fileExists } from '../utils/fileExists';

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
  certificationBadgeFilename: string;
  linkPreviewFilename: string;
};

const CertificatePage = ({
  certificate, certificateId, certificationBadgeFilename, linkPreviewFilename,
}: CertificatePageProps) => {
  if (!certificateId) {
    return (
      <main className="bluedot-base flex flex-col">
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

  // Build URLs from filenames determined server-side
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bluedot.org';
  const badgeRelativeUrl = `/images/certificates/${certificationBadgeFilename}`;
  const linkPreviewAbsoluteUrl = `${siteUrl}/images/certificates/link-preview/${linkPreviewFilename}`;

  return (
    <main className="bluedot-base flex flex-col">
      <Head>
        <title>{`${certificate.recipientName} has completed ${certificate.courseName} | BlueDot Impact`}</title>
        <meta name="description" content={certificate.certificationDescription || `Certificate of completion for ${certificate.courseName}`} />
        <meta name="robots" content="noindex" />

        {/* Open Graph meta tags */}
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

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${certificate.recipientName} has completed the ${certificate.courseName} course`} />
        <meta name="twitter:description" content={certificate.certificationDescription || `Certificate of completion for ${certificate.courseName}`} />
        <meta name="twitter:image" content={linkPreviewAbsoluteUrl} />
      </Head>

      <Section className="flex-1 pt-12">
        <div className="p-8 border-2 border-color-divider">
          <div className="flex flex-col justify-between md:flex-row md:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <FaCircleCheck className="size-5 text-bluedot-normal" />
                <P className="font-bold">Verified</P>
              </div>
              <P className="text-gray-700">This certificate was issued to <span className="font-bold">{certificate.recipientName}</span> on {new Date(certificate.certificateCreatedAt * 1000).toLocaleDateString()}</P>
            </div>
            <ShareButton text={`I was just awarded my certificate for BlueDot Impact's ${certificate.courseName} course!`} url={`${siteUrl}/certification?id=${certificateId}`}>Share your achievement</ShareButton>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 my-12">
          <div className="max-w-sm mx-auto sm:w-1/3">
            <img
              src={badgeRelativeUrl}
              alt={`${certificate.courseName} certification badge`}
              onError={(e) => {
                e.currentTarget.src = '/images/certificates/certificate-fallback-image.png';
              }}
            />
          </div>

          <div className="sm:w-2/3 space-y-4">
            <P><span className="text-bluedot-normal font-semibold">BlueDot Impact</span> confirms that</P>
            <P className="text-4xl font-serif font-bold">{certificate.recipientName}</P>
            <P className="text-gray-700">has successfully completed the</P>
            <P className="text-4xl mb-12 font-serif font-bold">{certificate.courseName} Course</P>

            <P>{certificate.certificationDescription}</P>

            <CTALinkOrButton url={certificate.courseDetailsUrl} variant="secondary">Learn more</CTALinkOrButton>
          </div>
        </div>

      </Section>
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
        certificationBadgeFilename: 'certificate-fallback-image.png',
        linkPreviewFilename: 'link-preview-fallback.png',
      },
    };
  }

  try {
    const certificate = await getCertificateData(certificateId);

    // Check if course-specific badge exists, otherwise use fallback
    const badgePath = path.join(
      process.cwd(),
      'public',
      'images',
      'certificates',
      `${certificate.courseSlug}.png`,
    );
    const certificationBadgeFilename = (await fileExists(badgePath))
      ? `${certificate.courseSlug}.png`
      : 'certificate-fallback-image.png';

    // Check if course-specific link preview exists, otherwise use fallback
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

    // Equivalent to `revalidate: 300` in getStaticProps. That can't be used here because we are
    // using query params rather than path params.
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=86400',
    );

    return {
      props: {
        certificate,
        certificateId,
        certificationBadgeFilename,
        linkPreviewFilename,
      },
    };
  } catch (error) {
    // Certificate not found or error fetching
    // eslint-disable-next-line no-console
    console.error('Error fetching certificate:', certificateId, error);
    return {
      props: {
        certificate: null,
        certificateId,
        certificationBadgeFilename: 'certificate-fallback-image.png',
        linkPreviewFilename: 'link-preview-fallback.png',
      },
    };
  }
};

CertificatePage.rawLayout = true;

export default CertificatePage;
