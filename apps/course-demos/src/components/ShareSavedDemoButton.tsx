import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ShareButton } from '@bluedot/ui';

type ShareSavedDemoButtonProps = {
  type: string;
  data: string;
  text: string;
};

export const ShareSavedDemoButton: React.FC<ShareSavedDemoButtonProps> = ({
  type,
  data,
  text,
}) => {
  const router = useRouter();
  const referralToken = typeof router.query.r === 'string' ? router.query.r : null;
  const [shareUrlData, setShareUrlData] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const getShareUrl = async (): Promise<string> => {
    if (data === shareUrlData && shareUrl) {
      return shareUrl;
    }

    const response = await fetch('/api/saved-output', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to share');
    }

    const { savedDemoOutputId } = await response.json();
    const generatedUrl = `${window.location.origin}/s/${savedDemoOutputId}${referralToken ? `?r=${referralToken}` : ''}`;
    setShareUrlData(data);
    setShareUrl(generatedUrl);
    return generatedUrl;
  };

  return <ShareButton url={getShareUrl} text={text} />;
};
