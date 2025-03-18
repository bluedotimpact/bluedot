import React, { useState, ReactNode } from 'react';
import { Button } from '@bluedot/ui';
import { Button as AriaButton } from 'react-aria-components';
import {
  FaFacebook, FaTwitter, FaLinkedin, FaCheck, FaShare, FaCopy,
} from 'react-icons/fa6';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { Modal } from './Modal';

interface SocialButtonProps {
  icon: ReactNode;
  color: string;
  onPress: () => void;
  children: ReactNode;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon, color, onPress, children,
}) => {
  return (
    <AriaButton
      onPress={onPress}
      className="flex flex-col items-center cursor-pointer group p-4 -m-4"
    >
      <div className={`size-12 rounded-full border flex items-center justify-center ${color} group-hover:bg-slate-100`}>
        {icon}
      </div>
      <span className="mt-2 text-sm">{children}</span>
    </AriaButton>
  );
};

interface ShareButtonProps {
  type: string;
  data: string;
  text?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  type,
  data,
  text = 'Check out what I created!',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [shareUrlData, setShareUrlData] = useState<string | null>(null);

  const router = useRouter();
  const referralToken = typeof router.query.r === 'string' ? router.query.r : null;

  const handleShare = async () => {
    if (data === shareUrlData) {
      setIsOpen(true);
      return;
    }

    try {
      setIsSharing(true);
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
      const url = `${window.location.origin}/s/${savedDemoOutputId}${referralToken ? `?r=${referralToken}` : ''}`;
      setShareUrlData(data);
      setShareUrl(url);
      setIsOpen(true);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const shareToSocial = (platform: string) => {
    if (!shareUrl) return;

    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }

    window.open(shareLink, '_blank');
  };

  return (
    <>
      <Button onPress={handleShare} disabled={isSharing}>
        <FaShare className="inline h-3 -ml-0.5 -mt-1" /> {isSharing ? 'Sharing...' : 'Share'}
      </Button>

      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Share">
        <div className="flex justify-center gap-10 m-8">
          <SocialButton
            icon={<FaFacebook size={24} />}
            color="text-blue-600"
            onPress={() => shareToSocial('facebook')}
          >
            Facebook
          </SocialButton>

          <SocialButton
            icon={<FaTwitter size={24} />}
            color="text-blue-400"
            onPress={() => shareToSocial('twitter')}
          >
            Twitter
          </SocialButton>

          <SocialButton
            icon={<FaLinkedin size={24} />}
            color="text-blue-700"
            onPress={() => shareToSocial('linkedin')}
          >
            LinkedIn
          </SocialButton>
        </div>

        <div className="mt-10 flex max-w-xs">
          <p className="w-full px-3 py-2 border rounded-md text-gray-700 select-all mr-2 whitespace-nowrap overflow-scroll">{shareUrl}</p>
          <AriaButton
            onPress={handleCopyToClipboard}
            className={clsx('bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md', isCopied && '!bg-green-100')}
          >
            {isCopied ? <span className="inline-flex items-center gap-1.5 text-sm"><FaCheck className="text-green-800" /> Copied</span> : <FaCopy />}
          </AriaButton>
        </div>
      </Modal>
    </>
  );
};
