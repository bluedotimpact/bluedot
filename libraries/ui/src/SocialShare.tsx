import type React from 'react';
import {
  FaEnvelope,
  FaGithub,
  FaXTwitter,
  FaLinkedin,
  FaFacebook,
} from 'react-icons/fa6';
import { ClickTarget } from './ClickTarget';

type SocialShareProps = {
  /** The path to append to origin for sharing (e.g. /courses/future-of-ai) */
  path?: string;
  /** The text to share */
  text?: string;
  /** Whether this is for contact links or sharing */
  variant?: 'default' | 'contact';
  /** Custom links for contact mode */
  emailLink?: string;
  githubOrgLink?: string;
  twitterLink?: string;
  linkedinLink?: string;
  facebookLink?: string;
};

export const SocialShare: React.FC<SocialShareProps> = ({
  path,
  text,
  variant = 'default',
  emailLink,
  githubOrgLink,
  twitterLink,
  linkedinLink,
  facebookLink,
}) => {
  const constructShareUrl = (campaign?: string) => {
    if (variant === 'contact') {
      return '';
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const fullPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    let url = `${baseUrl}${fullPath}`;

    if (campaign) {
      url = `${url}?utm_source=referral&utm_campaign=${campaign}`;
    }

    return url;
  };

  const getShareUrl = (platform: string): string => {
    if (variant === 'contact') {
      switch (platform) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        case 'email': return emailLink || '';
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        case 'github': return githubOrgLink || '';
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        case 'twitter': return twitterLink || '';
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        case 'linkedin': return linkedinLink || '';
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        case 'facebook': return facebookLink || '';
        default: return '';
      }
    }

    const shareUrl = constructShareUrl(platform);
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}${text ? `&text=${encodeURIComponent(text)}` : ''}`;
      case 'linkedin':
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}${text ? `&text=${encodeURIComponent(text)}` : ''}`;
      default:
        return '';
    }
  };

  const baseClasses = 'flex items-center justify-center size-12';
  const variantClasses = variant === 'contact'
    ? 'rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors'
    : 'text-gray-700 hover:text-gray-900 transition-colors';

  return (
    <div className="flex justify-center gap-4">
      {variant === 'contact' && emailLink && (
        <ClickTarget
          url={getShareUrl('email')}
          target="_blank"
          className={`${baseClasses} ${variantClasses}`}
          aria-label="Email"
        >
          <FaEnvelope size={20} />
        </ClickTarget>
      )}
      {variant === 'contact' && githubOrgLink && (
        <ClickTarget
          url={getShareUrl('github')}
          target="_blank"
          className={`${baseClasses} ${variantClasses}`}
          aria-label="GitHub"
        >
          <FaGithub size={20} />
        </ClickTarget>
      )}
      {(variant === 'default' || twitterLink) && (
        <ClickTarget
          url={getShareUrl('twitter')}
          target="_blank"
          className={`${baseClasses} ${variantClasses}`}
          aria-label="X (Twitter)"
        >
          <FaXTwitter size={20} />
        </ClickTarget>
      )}
      {(variant === 'default' || linkedinLink) && (
        <ClickTarget
          url={getShareUrl('linkedin')}
          target="_blank"
          className={`${baseClasses} ${variantClasses}`}
          aria-label="LinkedIn"
        >
          <FaLinkedin size={20} />
        </ClickTarget>
      )}
      {(variant === 'default' || facebookLink) && (
        <ClickTarget
          url={getShareUrl('facebook')}
          target="_blank"
          className={`${baseClasses} ${variantClasses}`}
          aria-label="Facebook"
        >
          <FaFacebook size={20} />
        </ClickTarget>
      )}
    </div>
  );
};
