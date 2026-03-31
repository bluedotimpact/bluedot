import { getHeadersWithValidToken } from '../utils/trpc';

const getFilenameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) {
    return null;
  }

  const filenameMatch = /filename="([^"]+)"/i.exec(contentDisposition);
  return filenameMatch?.[1] ?? null;
};

export const downloadDiscussionCalendarFile = async (discussionId: string) => {
  const response = await fetch(`/api/calendar/discussions/${encodeURIComponent(discussionId)}`, {
    headers: await getHeadersWithValidToken(),
  });

  if (!response.ok) {
    throw new Error(`Failed to download calendar file (${response.status})`);
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = getFilenameFromContentDisposition(response.headers.get('content-disposition')) ?? `bluedot-discussion-${discussionId}.ics`;
  downloadLink.style.display = 'none';

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
};
