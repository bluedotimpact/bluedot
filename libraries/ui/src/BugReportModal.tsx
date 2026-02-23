import type React from 'react';
import {
  useState, useEffect, useRef,
} from 'react';
import {
  FaCheck, FaPaperclip, FaImage, FaXmark,
} from 'react-icons/fa6';
import { Modal } from './Modal';
import { CTALinkOrButton } from './CTALinkOrButton';
import { ErrorView } from './ErrorView';
import { cn } from './utils';
import { P } from './Text';

export type FeedbackData = {
  description: string;
  email?: string;
  attachments: File[];
};

export type BugReportModalProps = {
  onSubmit?: (data: FeedbackData) => Promise<void>;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
};

export const BugReportModal: React.FC<BugReportModalProps> = ({
  onSubmit,
  isOpen = false,
  setIsOpen = () => {},
}) => {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setEmail('');
      setAttachments([]);
      setIsDragging(false);
      setIsSubmitting(false);
      setError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit?.({ description, email: email.trim() || undefined, attachments });
      setShowSuccess(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={<span className="text-[22px] font-semibold mx-auto">{showSuccess ? 'Thank you' : 'Submit feedback'}</span>}
      ariaLabel={showSuccess ? 'Thank you' : 'Submit feedback'}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light py-4"
    >
      <div className="w-full md:w-[560px]">
        {showSuccess ? (
          <div className="flex flex-col items-center gap-8">
            <div className="bg-bluedot-normal/10 flex rounded-full p-4">
              <FaCheck className="text-bluedot-normal size-8" />
            </div>
            <p className="text-size-sm text-center max-w-[500px] text-bluedot-navy/60">
              Your feedback has been sent! We'll be in touch if you've left your email and we have follow-up questions.
            </p>
            <CTALinkOrButton
              className="w-full mt-4"
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => {
                  setShowSuccess(false);
                  setDescription('');
                  setEmail('');
                  setAttachments([]);
                }, 200);
              }}
            >
              Close
            </CTALinkOrButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && <ErrorView error={error} />}

            <div className="flex flex-col gap-3">
              <P className='text-[13px] leading-[1.5] text-bluedot-navy'>We’re here to help! Whether it’s a bug or an idea on how to improve your experience, we’re all ears.</P>
              <label
                htmlFor="bug-description"
                className="text-size-sm font-medium text-bluedot-navy mt-2.5"
              >
                Description
              </label>

              <div
                className={cn(
                  'flex flex-col gap-3 p-3 rounded-lg border transition-colors',
                  isDragging
                    ? 'border-dashed border-bluedot-normal bg-bluedot-normal/[8%]'
                    : 'border-color-divider bg-white focus-within:border-bluedot-normal',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragging ? (
                  <div className="flex flex-col items-center justify-center gap-3 min-h-[140px]">
                    <FaImage className="size-8 text-bluedot-normal" />
                    <span className="text-size-sm text-center text-bluedot-normal opacity-80">
                      Drop any file(s) here to add them
                    </span>
                  </div>
                ) : (
                  <>
                    <textarea
                      id="bug-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onPaste={handlePaste}
                      className="w-full min-h-[120px] bg-transparent resize-none focus:outline-none text-[13px] placeholder:text-[13px]"
                      placeholder="What feedback would you like to share?"
                      required
                    />

                    {attachments.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {attachments.map((file, idx) => {
                          const isImage = file.type.startsWith('image/');
                          const objectUrl = isImage ? URL.createObjectURL(file) : null;
                          return (
                            <div
                              key={`${file.name}-${idx}`}
                              className="relative shrink-0"
                            >
                              {isImage && objectUrl ? (
                                <div className="size-12 rounded-[4px] border border-bluedot-navy/20 overflow-hidden">
                                  <img
                                    src={objectUrl}
                                    alt={file.name}
                                    className="size-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-12 px-2 flex items-center rounded-[4px] border border-color-divider bg-gray-50 text-size-xs text-bluedot-navy max-w-[120px] truncate">
                                  {file.name}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-1 -right-1 size-3 rounded-full bg-bluedot-navy flex items-center justify-center"
                                aria-label={`Remove ${file.name}`}
                              >
                                <FaXmark className="size-2 text-white" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (files.length > 0) {
                            setAttachments((prev) => [...prev, ...files]);
                          }
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-bluedot-navy/60 text-[12px]"
                      >
                        <FaPaperclip className="size-3.5 shrink-0" />
                        <span>Add, drag, or paste attachments here</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="bug-email"
                className="text-size-sm font-medium text-bluedot-navy"
              >
                Your contact email (optional)
              </label>
              <p className="text-[13px] text-bluedot-navy/60">
                Leave your email if you're happy for us to contact you with follow-ups.
              </p>
              <input
                id="bug-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-color-divider rounded-lg px-3 py-2 bg-white text-[13px] placeholder:text-[13px]"
                placeholder="Email"
              />
            </div>

            <CTALinkOrButton
              type="submit"
              className="w-full"
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </CTALinkOrButton>
          </form>
        )}
      </div>
    </Modal>
  );
};
