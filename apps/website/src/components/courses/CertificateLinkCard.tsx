import {
  addQueryParam,
  Card, CTALinkOrButton, P, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import type React from 'react';
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
      subtitle: 'To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.',
      buttonLabel: 'Request Certificate',
    },
    notEligible: {
      title: 'Your Certificate',
      subtitle: 'This course doesn\'t currently issue certificates to independent learners. Join a facilitated version to get a certificate.',
    },
  },
};

const foaiCourseConfig: CertificateConfig = {
  useCard: false,
  showCommunity: true,
  texts: {
    notLoggedIn: {
      header: 'Download your certificate, show you\'re taking AI seriously',
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
      header: 'Download your certificate, show you\'re taking AI seriously',
      description: 'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
      buttonLabel: 'Download Certificate',
    },
    notEligible: {
      title: 'Your Certificate',
      subtitle: 'This course doesn\'t currently issue certificates to independent learners. Join a facilitated version to get a certificate.',
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
        <div className="flex flex-col gap-2 w-full">
          <p className="text-center font-bold w-full">
            Want to go deeper?
          </p>
          <P className="text-center">
            <span className="font-semibold">The AGI Strategy course</span> is the natural next step: 25 hours, facilitated in small groups with live discussion. No specific background required. New rounds start every month.
          </P>
        </div>
        <div className="flex justify-center w-full">
          <CTALinkOrButton
            url="/courses/agi-strategy"
            variant="primary"
            withChevron
          >
            Apply now
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
              <P>{notLoggedIn.description}</P>
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
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          title={notLoggedIn.title || ''}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
  const { data: certificateData, isLoading, error, refetch } = trpc.certificates.getStatus.useQuery({ courseId });

  const requestCertificateMutation = trpc.certificates.request.useMutation({
    async onSuccess() {
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

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (error || requestCertificateMutation.isError) {
    const errorContent = (
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        <ErrorView error={error || requestCertificateMutation.error} />
        <CTALinkOrButton
          variant="primary"
          onClick={() => (error ? refetch() : requestCertificate())}
          disabled={isLoading ?? requestCertificateMutation.isPending}
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

  if (isLoading || requestCertificateMutation.isPending) {
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

  if (certificateData?.status === 'has-certificate') {
    const formattedCertificateDate = new Date(certificateData.issuedAt * 1000).toLocaleDateString(undefined, { dateStyle: 'long' });
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
                <p className="font-semibold text-bluedot-black">Earned by {certificateData.holderName}</p>
                <p className="text-bluedot-darker">Issued on {formattedCertificateDate}</p>
              </div>
            </div>
            <CTALinkOrButton
              url={addQueryParam(ROUTES.certification.url, 'id', certificateData.certificateId)}
              variant="primary"
              target="_blank"
              className="lg:ml-auto"
            >
              {hasCertificate.viewButtonLabel}
            </CTALinkOrButton>
          </div>
        </div>
      </Card>
    );
  }

  // For participants in facilitated rounds who do not yet have a certificate - returning `null` causes `ActionPlanCard`
  // to be rendered instead
  if (certificateData?.status === 'action-plan-pending') {
    return null;
  }

  // Facilitators: show requirements message WITHOUT button
  // (certificates issued via backend after 80% attendance)
  if (certificateData?.status === 'facilitator-pending') {
    return (
      <Card
        title="Your Certificate"
        subtitle="To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion."
        className="container-lined p-8 bg-white"
      />
    );
  }

  // For independent learners: show "not eligible" message
  if (certificateData?.status === 'not-eligible') {
    const { notEligible } = config.texts;
    return (
      <Card
        title={notEligible.title}
        subtitle={notEligible.subtitle}
        className="container-lined p-8 bg-white"
      />
    );
  }

  // certificateData?.status === 'can-request'
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
            <P>{requestCertConfig.description}</P>
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

  // Only FOAI courses reach here (non-FOAI courses return early above)
  // FOAI has useCard: false, so we use the container layout
  return (
    <div className="container-lined p-8 bg-white">
      {content}
    </div>
  );
};

export default CertificateLinkCard;
