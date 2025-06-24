import React, { useState } from 'react';
import {
  FaEnvelope,
  FaGithub,
  FaXTwitter,
  FaLinkedin,
} from 'react-icons/fa6';
import { Modal } from './Modal';
import { CTALinkOrButton } from './CTALinkOrButton';
import { ErrorView } from './ErrorView';

type SocialLinkProps = {
  icon: React.ReactNode;
  href: string;
  label: string;
};

const SocialLink: React.FC<SocialLinkProps> = ({ icon, href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center size-12 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors"
    aria-label={label}
  >
    {icon}
  </a>
);

export type BugReportModalProps = {
  onSubmit?: (message: string) => void;
  // Social media links
  showTextarea?: boolean;
  emailLink?: string;
  githubOrgLink?: string;
  githubLink?: string;
  twitterLink?: string;
  linkedinLink?: string;
};

export const BugReportModal: React.FC<BugReportModalProps> = ({
  onSubmit = () => {},
  showTextarea = false,
  emailLink = 'mailto:team@bluedot.org',
  githubOrgLink = 'https://github.com/bluedotimpact',
  githubLink = 'https://github.com/bluedotimpact/bluedot/issues/new?template=bug.yaml',
  twitterLink = 'https://x.com/BlueDotImpact',
  linkedinLink = 'https://www.linkedin.com/company/bluedotimpact/',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    try {
      await onSubmit(message);
      setMessage('');
      setIsOpen(false);
    } catch (err) {
      setError(err as Error);
    }
  };

  return (
    isOpen ? (
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Report an issue">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && <ErrorView error={error} />}
          <div>
            <p className="text-gray-600 mb-2">
              Found a bug or have an improvement to suggest?
              Please create an issue on{' '}
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </a>
              .
            </p>
            {showTextarea && (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your message"
            />
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            {showTextarea && (
              <CTALinkOrButton onClick={handleSubmit} className="w-full">
                Submit
              </CTALinkOrButton>
            )}

            <div className="text-center">
              <p className="text-gray-500 mb-3">Or reach us via these channels</p>
              <div className="flex justify-center gap-4">
                <SocialLink
                  icon={<FaEnvelope size={20} />}
                  href={emailLink}
                  label="Email"
                />
                <SocialLink
                  icon={<FaGithub size={20} />}
                  href={githubOrgLink}
                  label="GitHub"
                />
                <SocialLink
                  icon={<FaXTwitter size={20} />}
                  href={twitterLink}
                  label="X (Twitter)"
                />
                <SocialLink
                  icon={<FaLinkedin size={20} />}
                  href={linkedinLink}
                  label="LinkedIn"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    ) : (
      <CTALinkOrButton onClick={() => setIsOpen(true)}>
        Report an issue
      </CTALinkOrButton>
    )
  );
};
