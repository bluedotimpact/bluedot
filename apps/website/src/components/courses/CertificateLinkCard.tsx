import {
  addQueryParam,
  Auth,
  Card, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import React from 'react';
import { FaAward } from 'react-icons/fa6';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { GetCourseRegistrationResponse } from '../../pages/api/course-registrations/[courseId]';
import { ROUTES } from '../../lib/routes';
import { RequestCertificateRequest, RequestCertificateResponse } from '../../pages/api/certificates/request';

interface CertificateLinkCardProps {
  courseId: string;
}

const CertificateLinkCard: React.FC<CertificateLinkCardProps> = ({
  courseId,
}) => {
  const auth = useAuthStore((s) => s.auth);

  if (!auth) {
    return (
      <Card
        title="Your Certificate"
        subtitle="Create a free account to collect course certificates."
        className="container-lined p-8 bg-white"
      >
        <CTALinkOrButton
          url={typeof window === 'undefined' ? ROUTES.login.url : addQueryParam(ROUTES.login.url, 'redirect_to', window.location.pathname)}
          variant="primary"
        >
          Log in
        </CTALinkOrButton>
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
      />
    );
  }

  return (
    <Card
      title="Your Certificate"
      subtitle="If you've completed all the course exercises, you're eligible for a free course certificate."
      className="container-lined p-8 bg-white"
    >
      <CTALinkOrButton
        variant="primary"
        onClick={requestCertificate}
        disabled={certificateRequestLoading}
      >
        Request Certificate
      </CTALinkOrButton>
    </Card>
  );
};

export default CertificateLinkCard;
