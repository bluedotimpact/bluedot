import Head from 'next/head';
import { useRouter } from 'next/router';
import { ProgressDots } from '@bluedot/ui';
import { generateInvoiceUrl } from '../../../lib/generateInvoiceUrl';
import { trpc } from '../../../utils/trpc';

const FacilitatorFeedbackSuccessPage = () => {
  const router = useRouter();
  const meetPersonId = router.query.groupId as string;

  const { data, isLoading } = trpc.facilitators.getFeedbackFormData.useQuery(
    { meetPersonId },
    { enabled: !!meetPersonId },
  );

  if (isLoading || !router.isReady || !data) {
    return (
      <div className="min-h-screen bg-cream-normal flex items-center justify-center">
        <ProgressDots />
      </div>
    );
  }

  const invoiceUrl = generateInvoiceUrl({
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    email: data.email ?? '',
    compensationLumpSum: data.payForFacilitatedDiscussions ?? 0,
    roundTitle: data.roundName,
    contractStartDate: data.roundStartDate ?? '',
    contractEndDate: data.roundLastDiscussionDate ?? '',
  });

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>Thanks for your feedback | BlueDot Impact</title>
      </Head>
      <div className="max-w-[680px] mx-auto pt-8 pb-16 px-4 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Thanks for your feedback!</h1>
        <p>Next step: submit your invoice so we can pay you.</p>
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start underline text-bluedot-normal"
        >
          Open pre-filled invoice form →
        </a>
      </div>
    </div>
  );
};

export default FacilitatorFeedbackSuccessPage;
