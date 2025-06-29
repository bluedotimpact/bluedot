import {
  CTALinkOrButton,
  NewText,
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
import { P } from '../components/Text';

const CertificatePage = () => {
  const router = useRouter();
  const { id, r } = router.query;
  const certificateId = id ?? r;

  if (!certificateId) {
    return (
      <main className="bluedot-base flex flex-col">
        <Section className="flex-1">
          <div className="flex flex-col gap-4 mt-4">
            <NewText.H1>Missing certificate id</NewText.H1>
            <NewText.P>Check the link you were sent and try again.</NewText.P>
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
      <main className="bluedot-base flex flex-col">
        <Section className="flex-1">
          <div className="flex flex-col gap-4 mt-4">
            <NewText.H1>Certificate not found</NewText.H1>
            <NewText.P>We couldn't find the certificate you're looking for.</NewText.P>
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

  const { certificate } = data;

  return (
    <main className="bluedot-base flex flex-col">
      <Head>
        <title>{`${certificate.recipientName}'s Certificate | BlueDot Impact`}</title>
        <meta name="description" content={`Certificate of completion for ${certificate.courseName}`} />
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
            <ShareButton text={`I was just awarded my certificate for BlueDot Impact's ${certificate.courseName} course!`} url={`https://bluedot.org/certification?id=${certificateId}`}>Share your achievement</ShareButton>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 my-12">
          <div className="max-w-sm mx-auto sm:w-1/3">
            {/* TODO: fix images with postgres sync <img src={certificate.certificationBadgeImageSrc} alt="Certificate badge" /> */}
            <img src="https://storage.k8s.bluedot.org/website-assets/editor/8258c691-866c-4f81-826d-be26322d6681.svg" alt="Certificate badge" />
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

CertificatePage.rawLayout = true;

export default CertificatePage;
