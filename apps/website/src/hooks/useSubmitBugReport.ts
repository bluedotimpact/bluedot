import type { FeedbackData } from '@bluedot/ui';
import { trpc } from '../utils/trpc';
import { toBase64 } from '../utils/toBase64';

export const useSubmitBugReport = () => {
  const submitBugMutation = trpc.feedback.submitBugReport.useMutation();

  const handleBugReportSubmit = async (data: FeedbackData) => {
    await submitBugMutation.mutateAsync({
      description: data.description,
      email: data.email,
      recordingUrl: data.recordingUrl,
      attachments: await Promise.all(data.attachments?.map(async (file) => ({
        base64: (await toBase64(file)).split(',')[1] ?? '',
        filename: file.name,
        mimeType: file.type,
      })) ?? []),
    });
  };

  return handleBugReportSubmit;
};
