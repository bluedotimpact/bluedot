import {
  addQueryParam,
  Auth,
  Card, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import React from 'react';
import { FaAward } from 'react-icons/fa6';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { GetCourseRegistrationResponse } from '../../pages/api/course-registrations/[courseId]';
import { ROUTES } from '../../lib/routes';
import { RequestCertificateRequest, RequestCertificateResponse } from '../../pages/api/certificates/request';

type CertificateLinkCardProps = {
  courseId: string;
};

const CommunitySection = ({ leftContent }: { leftContent?: React.ReactNode }) => (
  <div className="border-t pt-6">
    <div className="flex items-center justify-between gap-4">
      {leftContent ? (
        <div className="min-w-[160px] flex justify-start">{leftContent}</div>
      ) : (
        <div className="min-w-[160px]" />
      )}
      <p className="text-center flex-1 font-bold">Join 3,245 graduates in our graduate community!</p>
      <div className="min-w-[160px] flex justify-end">
        <CTALinkOrButton
          url="https://community.bluedot.org"
          variant="primary"
          target="_blank"
        >
          Join the Community
        </CTALinkOrButton>
      </div>
    </div>
  </div>
);

const CertificateLinkCard: React.FC<CertificateLinkCardProps> = ({
  courseId,
}) => {
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  if (!auth) {
    return (
      <Card
        title="Your Certificate"
        subtitle="Create a free account to collect course certificates."
        className="container-lined p-8 bg-white"
      >
        <div className="mt-8">
          <CommunitySection
            leftContent={(
              <CTALinkOrButton
                url={getLoginUrl(router.asPath)}
                variant="primary"
                className="w-full"
              >
                Log in
              </CTALinkOrButton>
            )}
          />
        </div>
      </Card>
    );
  }

  return <CertificateLinkCardAuthed courseId={courseId} auth={auth} />;
};

const CertificateLinkCardAuthed: React.FC<CertificateLinkCardProps & { auth: Auth }> = ({
  courseId,
  auth,
}) => {
  const [{ data, loading, error }, refetch] = useAxios<GetCourseRegistrationResponse>({
    method: 'get',
    url: `/api/course-registrations/${courseId}`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  });

  const [{ loading: certificateRequestLoading, error: certificateRequestError }, refetchCertificateRequest] = useAxios<RequestCertificateResponse, RequestCertificateRequest>({
    method: 'post',
    url: '/api/certificates/request',
    data: {
      courseId,
    },
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });

  const requestCertificate = async () => {
    try {
      await refetchCertificateRequest();
      await refetch();
      // This is super ugly but saves us querying the db for the course slug until we want to generalize this to other courses
      if (typeof window !== 'undefined' && window.dataLayer && courseId === 'rec0Zgize0c4liMl5') {
        window.dataLayer.push({
          event: 'completers',
          course_slug: 'future-of-ai',
        });
      }
    } catch {
      // Ignore, handled already by useAxios
    }
  };

  if (error || certificateRequestError) {
    return (
      <Card
        title="Your Certificate"
        className="container-lined p-8 bg-white"
      >
        <div className="flex flex-col gap-4">
          <ErrorView error={error || certificateRequestError} />
          <CTALinkOrButton
            variant="primary"
            onClick={() => (error ? refetch() : requestCertificate()).catch(() => { /* ignore */ })}
            disabled={loading || certificateRequestLoading}
          >
            Retry
          </CTALinkOrButton>
        </div>
      </Card>
    );
  }

  if (loading || certificateRequestLoading) {
    return (
      <Card
        title="Your Certificate"
        className="container-lined p-8 bg-white"
      >
        <ProgressDots />
      </Card>
    );
  }

  if (data?.courseRegistration.certificateId) {
    const formattedCertificateDate = new Date(data.courseRegistration.certificateCreatedAt ? data.courseRegistration.certificateCreatedAt * 1000 : Date.now()).toLocaleDateString(undefined, { dateStyle: 'long' });
    return (
      <Card
        title="Your Certificate"
        subtitle="View your certificate to share your achievement."
        className="container-lined p-8 bg-white"
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4 bg-bluedot-lighter p-3 rounded-lg">
                <FaAward size={24} className="text-bluedot-normal" />
              </div>
              <div>
                <p className="font-semibold text-bluedot-black">Earned by {data.courseRegistration.fullName || data.courseRegistration.email}</p>
                <p className="text-bluedot-darker">Issued on {formattedCertificateDate}</p>
              </div>
            </div>
            <CTALinkOrButton
              url={addQueryParam(ROUTES.certification.url, 'id', data.courseRegistration.certificateId)}
              variant="primary"
            >
              View Certificate
            </CTALinkOrButton>
          </div>

          <CommunitySection />
        </div>
      </Card>
    );
  }

  // Only future-of-ai certificates can be earned independently
  if (data?.courseRegistration.courseId !== 'rec0Zgize0c4liMl5') {
    return (
      <Card
        title="Your Certificate"
        subtitle="This course doesn't currently issue certificates to independent learners. Join a facilitated version to get a certificate."
        className="container-lined p-8 bg-white"
      >
        <CommunitySection />

      </Card>
    );
  }

  return (
    <Card
      title="Your Certificate"
      subtitle="If you've completed all the course exercises, you're eligible for a free course certificate."
      className="container-lined p-8 bg-white"
    >
      <div className="mt-8">
        <CommunitySection
          leftContent={(
            <CTALinkOrButton
              variant="primary"
              onClick={requestCertificate}
              disabled={certificateRequestLoading}
              className="w-full"
            >
              Request Certificate
            </CTALinkOrButton>
          )}
        />
      </div>
    </Card>
  );
};

export default CertificateLinkCard;
