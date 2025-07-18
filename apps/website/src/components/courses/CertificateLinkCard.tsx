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

type CertificateConfig = {
  useCard: boolean;
  showCommunity: boolean;
  texts: {
    notLoggedIn: {
      title?: string;
      subtitle?: string;
      header?: string;
      description?: string;
      buttonLabel: string;
    };
    loading: {
      title: string;
    };
    error: {
      title: string;
    };
    hasCertificate: {
      title: string;
      subtitle: string;
      viewButtonLabel: string;
    };
    requestCertificate: {
      title?: string;
      subtitle?: string;
      header?: string;
      description?: string;
      buttonLabel: string;
    };
    notEligible: {
      title: string;
      subtitle: string;
    };
  };
};

const FOAI_COURSE_ID = 'rec0Zgize0c4liMl5';

const regularCourseConfig: CertificateConfig = {
  useCard: true,
  showCommunity: true,
  texts: {
    notLoggedIn: {
      title: 'Your Certificate',
      subtitle: 'Create a free account to collect course certificates.',
      buttonLabel: 'Log in',
    },
    loading: {
      title: 'Your Certificate',
    },
    error: {
      title: 'Your Certificate',
    },
    hasCertificate: {
      title: 'Your Certificate',
      subtitle: 'View your certificate to share your achievement.',
      viewButtonLabel: 'View Certificate',
    },
    requestCertificate: {
      title: 'Your Certificate',
      subtitle: "If you've completed all the course exercises, you're eligible for a free course certificate.",
      buttonLabel: 'Request Certificate',
    },
    notEligible: {
      title: 'Your Certificate',
      subtitle: "This course doesn't currently issue certificates to independent learners. Join a facilitated version to get a certificate.",
    },
  },
};

const foaiCourseConfig: CertificateConfig = {
  useCard: false,
  showCommunity: false,
  texts: {
    notLoggedIn: {
      header: "Download your certificate, show you're taking AI seriously",
      description: 'Complete all answers to unlock your certificate, then share your accomplishment on social media.',
      buttonLabel: 'Download Certificate',
    },
    loading: {
      title: 'Your Certificate',
    },
    error: {
      title: 'Your Certificate',
    },
    hasCertificate: {
      title: 'Your Certificate',
      subtitle: 'View your certificate to share your achievement.',
      viewButtonLabel: 'View Certificate',
    },
    requestCertificate: {
      header: "Download your certificate, show you're taking AI seriously",
      description: 'Complete all answers to unlock your certificate, then share your accomplishment on social media.',
      buttonLabel: 'Download Certificate',
    },
    notEligible: {
      title: 'Your Certificate',
      subtitle: "This course doesn't currently issue certificates to independent learners. Join a facilitated version to get a certificate.",
    },
  },
};

type CertificateLinkCardProps = {
  courseId: string;
};

const CommunitySection = ({ leftContent }: { leftContent?: React.ReactNode }) => {
  return (
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
};

const CertificateLinkCard: React.FC<CertificateLinkCardProps> = ({
  courseId,
}) => {
  const config = courseId === FOAI_COURSE_ID ? foaiCourseConfig : regularCourseConfig;
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  if (!auth) {
    const { notLoggedIn } = config.texts;
    const content = (
      <>
        {config.useCard ? null : (
          <div className="flex flex-col gap-2">
            {notLoggedIn.header && (
              <p className="bluedot-h4 mb-2 text-center">{notLoggedIn.header}</p>
            )}
            {notLoggedIn.description && (
              <p className="bluedot-p">{notLoggedIn.description}</p>
            )}
          </div>
        )}
        <div className={config.useCard ? 'mt-8' : 'mt-4 flex justify-start'}>
          {config.showCommunity ? (
            <CommunitySection
              leftContent={(
                <CTALinkOrButton
                  url={getLoginUrl(router.asPath)}
                  variant="primary"
                  className="w-full"
                >
                  {notLoggedIn.buttonLabel}
                </CTALinkOrButton>
              )}
            />
          ) : (
            <CTALinkOrButton
              url={getLoginUrl(router.asPath)}
              variant="primary"
            >
              {notLoggedIn.buttonLabel}
            </CTALinkOrButton>
          )}
        </div>
      </>
    );

    if (config.useCard) {
      return (
        <Card
          title={notLoggedIn.title || ''}
          subtitle={notLoggedIn.subtitle || ''}
          className="container-lined p-8 bg-white"
        >
          {content}
        </Card>
      );
    }

    return (
      <div className="container-lined p-8 bg-white">
        {content}
      </div>
    );
  }

  return <CertificateLinkCardAuthed courseId={courseId} auth={auth} config={config} />;
};

const CertificateLinkCardAuthed: React.FC<CertificateLinkCardProps & { auth: Auth; config: CertificateConfig }> = ({
  courseId,
  auth,
  config,
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
    const errorContent = (
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
    );

    if (config.useCard) {
      return (
        <Card
          title={config.texts.error.title}
          className="container-lined p-8 bg-white"
        >
          {errorContent}
        </Card>
      );
    }

    return (
      <div className="container-lined p-8 bg-white">
        {errorContent}
      </div>
    );
  }

  if (loading || certificateRequestLoading) {
    if (config.useCard) {
      return (
        <Card
          title={config.texts.loading.title}
          className="container-lined p-8 bg-white"
        >
          <ProgressDots />
        </Card>
      );
    }

    return (
      <div className="container-lined p-8 bg-white">
        <ProgressDots />
      </div>
    );
  }

  if (data?.courseRegistration.certificateId) {
    const formattedCertificateDate = new Date(data.courseRegistration.certificateCreatedAt ? data.courseRegistration.certificateCreatedAt * 1000 : Date.now()).toLocaleDateString(undefined, { dateStyle: 'long' });
    const { hasCertificate } = config.texts;

    // For FoAI, use Card even though useCard is false, as per the existing behavior
    return (
      <Card
        title={hasCertificate.title}
        subtitle={hasCertificate.subtitle}
        className="container-lined p-8 bg-white"
      >
        <div className="flex flex-col gap-8 w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
            <div className="flex items-center min-w-0">
              <div className="mr-4 bg-bluedot-lighter p-3 rounded-lg flex-shrink-0">
                <FaAward size={24} className="text-bluedot-normal" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-bluedot-black">Earned by {data.courseRegistration.fullName || data.courseRegistration.email}</p>
                <p className="text-bluedot-darker">Issued on {formattedCertificateDate}</p>
              </div>
            </div>
            <CTALinkOrButton
              url={addQueryParam(ROUTES.certification.url, 'id', data.courseRegistration.certificateId)}
              variant="primary"
              target="_blank"
              className="lg:ml-auto"
            >
              {hasCertificate.viewButtonLabel}
            </CTALinkOrButton>
          </div>

          {config.showCommunity && <CommunitySection />}
        </div>
      </Card>
    );
  }

  // Only future-of-ai certificates can be earned independently
  if (data?.courseRegistration.courseId !== 'rec0Zgize0c4liMl5') {
    const { notEligible } = config.texts;
    return (
      <Card
        title={notEligible.title}
        subtitle={notEligible.subtitle}
        className="container-lined p-8 bg-white"
      >
        {config.showCommunity && <CommunitySection />}
      </Card>
    );
  }

  // Request certificate state
  const { requestCertificate: requestCertConfig } = config.texts;
  const content = (
    <>
      {config.useCard ? null : (
        <div className="flex flex-col gap-2">
          {requestCertConfig.header && (
            <p className="bluedot-h4 mb-2 text-center">{requestCertConfig.header}</p>
          )}
          {requestCertConfig.description && (
            <p className="bluedot-p">{requestCertConfig.description}</p>
          )}
        </div>
      )}
      <div className={config.useCard ? 'mt-8' : 'mt-4 flex justify-start'}>
        {config.showCommunity ? (
          <CommunitySection
            leftContent={(
              <CTALinkOrButton
                variant="primary"
                onClick={requestCertificate}
                disabled={certificateRequestLoading}
                className="w-full"
              >
                {requestCertConfig.buttonLabel}
              </CTALinkOrButton>
            )}
          />
        ) : (
          <CTALinkOrButton
            variant="primary"
            onClick={requestCertificate}
            disabled={certificateRequestLoading}
          >
            {requestCertConfig.buttonLabel}
          </CTALinkOrButton>
        )}
      </div>
    </>
  );

  if (config.useCard) {
    return (
      <Card
        title={requestCertConfig.title || ''}
        subtitle={requestCertConfig.subtitle || ''}
        className="container-lined p-8 bg-white"
      >
        {content}
      </Card>
    );
  }

  return (
    <div className="container-lined p-8 bg-white">
      {content}
    </div>
  );
};

export default CertificateLinkCard;
