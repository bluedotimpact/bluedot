import {
  CTALinkOrButton,
  H1,
  P,
  ProgressDots,
  Section,
  Footer,
  ShareButton,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { FaCircleCheck } from 'react-icons/fa6';
import { GetCertificateResponse } from './api/certificates/[certificateId]';
import { ROUTES } from '../lib/routes';

const CertificatePage = () => {
  const router = useRouter();
  const { id, r } = router.query;
  const certificateId = id ?? r;

  if (!certificateId) {
    return (
      <Section>
        <H1>Invalid certificate</H1>
        <P>Check the link you were sent and try again.</P>
        <div className="flex flex-row gap-4 mt-4">
          <CTALinkOrButton url={ROUTES.courses.url}>Back to Courses</CTALinkOrButton>
          <CTALinkOrButton url={ROUTES.contact.url} variant="secondary">Contact us</CTALinkOrButton>
        </div>
      </Section>
    );
  }

  const [{ data, loading, error }] = useAxios<GetCertificateResponse>({
    method: 'get',
    url: certificateId ? `/api/certificates/${certificateId}` : undefined,
  });

  if (loading) {
    return (
      <main className="bluedot-base flex justify-center items-center">
        <ProgressDots />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="bluedot-base">
        <Section>
          <H1>Certificate not found</H1>
          <P>We couldn't find the certificate you're looking for.</P>
          <div className="flex flex-row gap-4 mt-4">
            <CTALinkOrButton url={ROUTES.courses.url}>Back to Courses</CTALinkOrButton>
            <CTALinkOrButton url={ROUTES.contact.url} variant="secondary">Contact us</CTALinkOrButton>
          </div>
        </Section>
      </main>
    );
  }

  const { certificate } = data;

  return (
    <main className="bluedot-base flex flex-col">
      <Head>
        <title>{certificate.recipientName}'s Certificate | BlueDot Impact</title>
        <meta name="description" content={`Certificate of completion for ${certificate.courseName}`} />
      </Head>

      <Section className="flex-1 pt-12">
        <div className="p-8 border-2 border-color-divider">
          <div className="flex flex-col justify-between md:flex-row md:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <FaCircleCheck className="size-5 text-bluedot-normal" />
                <p className="font-bold">Verified</p>
              </div>
              <p className="text-gray-700">This certificate was issued to <span className="font-bold">{certificate.recipientName}</span> on {new Date(certificate.certificateCreatedAt * 1000).toLocaleDateString()}</p>
            </div>
            <ShareButton text={`I was just awarded my certificate for BlueDot Impact's ${certificate.courseName} course!`} url={`https://course.bluedot.org/certification?id=${certificateId}`}>Share your achievement</ShareButton>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 my-12">
          <div className="md:w-1/3">
            <img src={certificate.certificationBadgeImageSrc} alt="Certificate badge" />
          </div>

          <div className="md:w-2/3 space-y-4">
            <p><span className="text-bluedot-normal font-semibold">BlueDot Impact</span> confirms that</p>
            <p className="text-4xl font-serif font-bold">{certificate.recipientName}</p>
            <p className="text-gray-700">has successfully completed the</p>
            <p className="text-4xl mb-12 font-serif font-bold">{certificate.courseName} Course</p>

            <p>{certificate.certificationDescription}</p>

            <CTALinkOrButton url={certificate.courseDetailsUrl} variant="secondary">Learn more</CTALinkOrButton>
          </div>
        </div>

      </Section>
      <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
    </main>
  );
};

CertificatePage.rawLayout = true;

export default CertificatePage;
