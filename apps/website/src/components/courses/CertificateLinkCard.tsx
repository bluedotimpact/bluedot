import {
  addQueryParam,
  Card, CTALinkOrButton, ProgressDots, useAuthStore, useCurrentTimeMs,
} from '@bluedot/ui';
import React from 'react';
import { FaAward } from 'react-icons/fa6';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { useRouter } from 'next/router';
import { getLoginUrl } from '../../utils/getLoginUrl';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

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

const regularCourseConfig: CertificateConfig = {
  useCard: true,
  showCommunity: false,
  texts: {
    notLoggedIn: {
      title: 'Your Certificate',
      subtitle: 'Create a free account to earn your course certificate.',
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
      subtitle: 'View your certificate and share your achievement.',
      viewButtonLabel: 'View Certificate',
    },
    requestCertificate: {
      title: 'Your Certificate',
      subtitle: "If you've engaged in >80% of discussions and submitted your action plan, you'll receive a certificate.",
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
  showCommunity: true,
  texts: {
    notLoggedIn: {
      header: "Download your certificate, show you're taking AI seriously",
      description: 'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
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
      description: 'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
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
    <div className="border-t pt-6 w-full">
      <div className="flex flex-col gap-4 w-full">
        {leftContent && (
          <div className="flex justify-center w-full">
            {leftContent}
          </div>
        )}
        <p className="text-center font-bold w-full">Join 3,245 graduates in our graduate community!</p>
        <div className="flex justify-center w-full">
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

  return <CertificateLinkCardAuthed courseId={courseId} config={config} />;
};

const CertificateLinkCardAuthed: React.FC<CertificateLinkCardProps & { config: CertificateConfig }> = ({
  courseId,
  config,
}) => {
  const {
    data: courseRegistration, isLoading: loading, error, refetch,
  } = trpc.courseRegistrations.getByCourseId.useQuery({ courseId });
  const currentTimeMs = useCurrentTimeMs();

  const {
    data: meetPerson,
    isLoading: meetPersonLoading,
    error: meetPersonError,
  } = trpc.meetPerson.getByCourseRegistrationId.useQuery(
    { courseRegistrationId: courseRegistration?.id || '' },
    { enabled: !!courseRegistration?.id },
  );

  const requestCertificateMutation = trpc.certificates.request.useMutation({
    onSuccess: async () => {
      await refetch();
      // This is super ugly but saves us querying the db for the course slug until we want to generalize this to other courses
      if (typeof window !== 'undefined' && window.dataLayer && courseId === FOAI_COURSE_ID) {
        window.dataLayer.push({
          event: 'completers',
          course_slug: 'future-of-ai',
        });
      }
    },
  });

  const requestCertificate = () => {
    requestCertificateMutation.mutate({ courseId });
  };

  if (error || requestCertificateMutation.isError) {
    const errorContent = (
      <div className="flex flex-col gap-4">
        <ErrorView error={error || requestCertificateMutation.error} />
        <CTALinkOrButton
          variant="primary"
          onClick={() => (error ? refetch() : requestCertificate())}
          disabled={loading || requestCertificateMutation.isPending}
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

  if (loading || requestCertificateMutation.isPending || meetPersonLoading) {
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

  if (courseRegistration?.certificateId) {
    const formattedCertificateDate = new Date(
      courseRegistration?.certificateCreatedAt ? courseRegistration.certificateCreatedAt * 1000 : currentTimeMs,
    ).toLocaleDateString(undefined, { dateStyle: 'long' });
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
                <p className="font-semibold text-bluedot-black">Earned by {courseRegistration.fullName || courseRegistration.email}</p>
                <p className="text-bluedot-darker">Issued on {formattedCertificateDate}</p>
              </div>
            </div>
            <CTALinkOrButton
              url={addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)}
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
  // Note: the check `courseRegistration?.courseId !== FOAI_COURSE_ID` is required because we
  // used to auto-create course registrations for independent learners for all courses, see https://github.com/bluedotimpact/bluedot/issues/1500
  if (courseRegistration?.courseId !== FOAI_COURSE_ID) {
    // Hide certificate card if user should see ActionPlanCard instead
    // ActionPlanCard shows when: facilitated course + no certificate + meetPerson exists
    // If meetPerson doesn't exist or there's an error fetching it, show certificate card as fallback
    if (!courseRegistration?.certificateId && meetPerson && !meetPersonError) {
      // Return null - ActionPlanCard will show instead
      return null;
    }

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
                disabled={requestCertificateMutation.isPending}
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
            disabled={requestCertificateMutation.isPending}
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
