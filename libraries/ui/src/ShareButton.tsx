import { type ReactNode } from 'react';
import type React from 'react';
import { useState } from 'react';
import {
  FaFacebook, FaXTwitter, FaLinkedin, FaCheck, FaCopy,
} from 'react-icons/fa6';
import clsx from 'clsx';
import { Modal } from './Modal';
import { ClickTarget } from './ClickTarget';
import { ErrorView } from './ErrorView';
import { CTALinkOrButton } from './CTALinkOrButton';

type SocialButtonProps = {
  icon: ReactNode;
  color: string;
  onClick: () => void;
  children: ReactNode;
};

const SocialButton: React.FC<SocialButtonProps> = ({
  icon, color, onClick, children,
}) => {
  return (
    <ClickTarget
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer group p-4 -m-4"
    >
      <div className={`size-12 rounded-full border flex items-center justify-center ${color} group-hover:bg-slate-100`}>
        {icon}
      </div>
      <span className="mt-2 text-size-sm">{children}</span>
    </ClickTarget>
  );
};

export type ShareButtonProps = React.PropsWithChildren<{
  /** The URL for users to share on social media */
  url?: string | (() => string | Promise<string>);
  /** The text for users to share on social media */
  text?: string;
}>;

export const ShareButton: React.FC<ShareButtonProps> = ({
  url = window.location.href,
  text = '',
  children = 'Share',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<unknown | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);

      let finalUrl: string;
      if (typeof url === 'function') {
        finalUrl = await url();
      } else {
        finalUrl = url;
      }

      setShareUrl(finalUrl);
      setIsOpen(true);
    } catch (error) {
      setShareError(error);
      setIsOpen(true);
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
    if (!shareUrl) {
      return;
    }

    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'x':
        shareLink = `https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }

    window.open(shareLink, '_blank');
  };

  return (
    <>
      <CTALinkOrButton onClick={handleShare} disabled={isSharing}>
        {isSharing ? 'Sharing...' : children}
      </CTALinkOrButton>

      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Share">
        {shareError ? <ErrorView error={shareError} /> : (
          <>
            <div className="flex justify-center gap-10 m-8">
              <SocialButton
                icon={<FaFacebook size={24} />}
                color="text-blue-600"
                onClick={() => shareToSocial('facebook')}
              >
                Facebook
              </SocialButton>

              <SocialButton
                icon={<FaXTwitter size={24} />}
                color="text-black"
                onClick={() => shareToSocial('x')}
              >
                X
              </SocialButton>

              <SocialButton
                icon={<FaLinkedin size={24} />}
                color="text-blue-700"
                onClick={() => shareToSocial('linkedin')}
              >
                LinkedIn
              </SocialButton>
            </div>

            <div className="mt-10 flex max-w-xs">
              <p className="w-full px-3 py-2 border rounded-md text-gray-700 select-all mr-2 whitespace-nowrap overflow-x-auto">{shareUrl}</p>
              <ClickTarget
                onClick={handleCopyToClipboard}
                className={clsx('bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md', isCopied && '!bg-green-100')}
              >
                {isCopied ? <span className="inline-flex items-center gap-1.5 text-size-sm"><FaCheck className="text-green-800" /> Copied</span> : <FaCopy />}
              </ClickTarget>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};
