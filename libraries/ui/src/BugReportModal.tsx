import type React from 'react';
import { useState } from 'react';
import { Modal } from './Modal';
import { CTALinkOrButton } from './CTALinkOrButton';
import { ErrorView } from './ErrorView';
import { SocialShare } from './SocialShare';
import { A } from './Text';

export type BugReportModalProps = {
  onSubmit?: (message: string) => void | Promise<void>;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
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
  isOpen = false,
  setIsOpen = () => {},
  showTextarea = false,
  emailLink = 'mailto:team@bluedot.org',
  githubOrgLink = 'https://github.com/bluedotimpact',
  githubLink = 'https://github.com/bluedotimpact/bluedot/issues/new?template=bug.yaml',
  twitterLink = 'https://x.com/BlueDotImpact',
  linkedinLink = 'https://www.linkedin.com/company/bluedotimpact/',
}) => {
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
    isOpen && (
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Submit feedback">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto">
          {error && <ErrorView error={error} />}
          <div>
            <p className="text-gray-600 mb-2">
              Found a bug that is pestering you or have an idea on how to make the experience better?
              Great, we'd love to hear from you! Bonus points if you can submit your feedback as an issue in {' '}
              <A
                href={githubLink}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                GitHub
              </A>
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
              <CTALinkOrButton type="submit" className="w-full">
                Submit
              </CTALinkOrButton>
            )}

            <div className="text-center">
              <p className="text-gray-500 mb-3">Reach us via these channels</p>
              <SocialShare
                variant="contact"
                emailLink={emailLink}
                githubOrgLink={githubOrgLink}
                twitterLink={twitterLink}
                linkedinLink={linkedinLink}
              />
            </div>
          </div>
        </form>
      </Modal>
    )
  );
};
