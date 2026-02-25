import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  FaCheck, FaImage, FaPaperclip, FaVideo, FaXmark,
} from 'react-icons/fa6';
import { CTALinkOrButton } from './CTALinkOrButton';
import { ErrorView } from './ErrorView';
import { Modal } from './Modal';
import { cn } from './utils';
import { ProgressDots } from './ProgressDots';

export type FeedbackData = {
  description: string;
  email?: string;
  attachments: File[];
  recordingUrl?: string;
};

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type BugReportModalProps = {
  onSubmit?: (data: FeedbackData) => Promise<void>;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onRecordScreen?: () => void;
  recordingUrl?: string;
};

const FileAttachmentItem = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const isImage = file.type.startsWith('image/');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);
  return (
    <div className="relative shrink-0">
      {isImage && objectUrl ? (
        <div className="border-bluedot-navy/20 size-12 overflow-hidden rounded-[4px] border">
          <img src={objectUrl} alt={file.name} className="size-full object-cover" />
        </div>
      ) : (
        <div className="border-color-divider text-size-xs text-bluedot-navy flex h-12 max-w-[120px] items-center truncate rounded-[4px] border bg-gray-50 px-2">
          {file.name}
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="bg-bluedot-navy absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full"
        aria-label={`Remove ${file.name}`}
      >
        <FaXmark className="size-2 text-white" />
      </button>
    </div>
  );
};

export const BugReportModal: React.FC<BugReportModalProps> = ({
  onSubmit,
  isOpen = false,
  setIsOpen = () => {},
  onRecordScreen,
  recordingUrl,
}) => {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recordingUrlInput, setRecordingUrlInput] = useState(recordingUrl ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecordingUrlInput(recordingUrl ?? '');
  }, [recordingUrl]);

  useEffect(() => {
    if (isOpen) {
      // Don't reset description, email, and attachments on open.
      // When screen recording using Birdie, the user will close the modal, record their screen, then reopen the modal
      // to submit, so we want to preserve their inputs.
      // After a successful submission we reset the form with `resetForm` below.
      setIsDragging(false);
      setIsSubmitting(false);
      setError(null);
      setAttachmentError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const resetForm = () => {
    setDescription('');
    setEmail('');
    setAttachments([]);
    setAttachmentError(null);
    setRecordingUrlInput('');
  };

  const addFiles = (newFiles: File[]) => {
    const oversized = newFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
    const slotsRemaining = MAX_ATTACHMENTS - attachments.length;
    const filesToAdd = validFiles.slice(0, slotsRemaining);
    const tooMany = validFiles.length > slotsRemaining;

    if (oversized.length > 0 && tooMany) {
      setAttachmentError(`Some files were not added: files must be under 10 MB each, and you can attach a maximum of ${MAX_ATTACHMENTS} files.`);
    } else if (oversized.length > 0) {
      setAttachmentError(`Files must be under 10 MB each. ${oversized.length === 1 ? '1 file was' : `${oversized.length} files were`} not added.`);
    } else if (tooMany) {
      setAttachmentError(`You can attach a maximum of ${MAX_ATTACHMENTS} files.`);
    } else {
      setAttachmentError(null);
    }

    if (filesToAdd.length > 0) {
      setAttachments((prev) => [...prev, ...filesToAdd]);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open && showSuccess) resetForm();
    setIsOpen(open);
  };

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
      addFiles(files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit?.({
        description, email: email.trim() || undefined, attachments, recordingUrl: recordingUrlInput.trim() || undefined,
      });
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
      setIsOpen={handleModalOpenChange}
      title={<span className="mx-auto text-[22px] font-semibold">{showSuccess ? 'Thank you' : 'Submit feedback'}</span>}
      ariaLabel={showSuccess ? 'Thank you' : 'Submit feedback'}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light py-4"
    >
      <div className="w-full md:w-[560px]">
        {showSuccess ? (
          <div className="flex flex-col items-center gap-8">
            <div className="bg-bluedot-normal/10 flex rounded-full p-4 mt-2">
              <FaCheck className="text-bluedot-normal size-8" />
            </div>
            <p className="text-[13px] leading-[1.5] text-bluedot-navy/60 max-w-[500px] text-center">
              Your feedback has been sent! We'll be in touch if you've left your email and we have follow-up questions.
            </p>
            <CTALinkOrButton
              className="mt-4 w-full"
              onClick={() => handleModalOpenChange(false)}
            >
              Close
            </CTALinkOrButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && <ErrorView error={error} />}

            <div className="flex flex-col gap-1.5">
              <p className="text-bluedot-navy text-[13px] leading-[1.5]">
                We're here to help! Whether it's a bug or an idea on how to improve your experience, we're all ears.
              </p>
              <label htmlFor="bug-description" className="text-[13px] font-semibold leading-5.5 text-bluedot-navy mt-2.5">
                Description
              </label>

              <div
                className={cn(
                  'flex flex-col gap-3 rounded-lg border p-3 transition-colors',
                  isDragging
                    ? 'border-bluedot-normal bg-bluedot-normal/[8%] border-dashed'
                    : 'border-color-divider focus-within:border-bluedot-normal bg-white',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragging ? (
                  <div className="flex min-h-[140px] flex-col items-center justify-center gap-3">
                    <FaImage className="text-bluedot-normal size-8" />
                    <span className="text-size-sm text-bluedot-normal text-center opacity-80">
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
                      className="min-h-[120px] w-full resize-none bg-transparent text-[13px] placeholder:text-[13px] focus:outline-none"
                      placeholder="What feedback would you like to share?"
                      required
                    />

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, idx) => (
                          <FileAttachmentItem
                            key={`${file.name}-${idx}`}
                            file={file}
                            onRemove={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          />
                        ))}
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
                            addFiles(files);
                          }

                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-bluedot-navy/60 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] hover:bg-gray-100"
                      >
                        <FaPaperclip className="size-3.5 shrink-0" />
                        <span>Add, drag, or paste attachments here</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {attachmentError && (
                <p className="text-red-600 text-size-sm mt-1" role="alert" aria-live="polite">
                  {attachmentError}
                </p>
              )}
            </div>

            {onRecordScreen && (
              <div className="hidden md:flex flex-col gap-3">
                <p className="text-[13px] font-semibold text-bluedot-navy">
                  Could you show us with a video?
                </p>
                {recordingUrl ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2.5 rounded-[5px] bg-[#0EAC53] text-white px-3 py-2">
                        <FaCheck className="size-3.5 shrink-0" />
                        <span className="text-[13px]">Recording saved</span>
                      </div>
                      <button
                        type="button"
                        onClick={onRecordScreen}
                        className="flex items-center gap-[10px] h-9 px-3 rounded-[5px] border border-bluedot-normal text-bluedot-normal text-[13px] font-medium cursor-pointer"
                      >
                        <FaVideo className="size-4 shrink-0" />
                        Re-record
                      </button>
                    </div>
                    <input
                      type="url"
                      value={recordingUrlInput}
                      onChange={(e) => setRecordingUrlInput(e.target.value)}
                      className="border-color-divider rounded-lg border bg-white px-3 py-2 text-[13px] text-bluedot-navy/60 placeholder:text-[13px]"
                      aria-label="Recording URL"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onRecordScreen}
                    className="flex items-center gap-[10px] h-9 px-3 rounded-[5px] bg-bluedot-normal text-white text-[13px] font-medium self-start cursor-pointer"
                  >
                    <FaVideo className="size-4 shrink-0" />
                    Record my screen
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bug-email" className="text-[13px] font-semibold leading-5.5 text-bluedot-navy">
                Your contact email (optional)
              </label>
              <p className="text-bluedot-navy/60 text-[13px]">
                Leave your email if you're happy for us to contact you with follow-ups.
              </p>
              <input
                id="bug-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-color-divider rounded-lg border bg-white px-3 py-2 text-[13px] placeholder:text-[13px]"
                placeholder="Email"
              />
            </div>

            <CTALinkOrButton type="submit" className="w-full" disabled={isSubmitting || !description.trim()}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  Submitting
                  <ProgressDots className="my-0" dotClassName="bg-white" />
                </span>
              ) : (
                'Submit'
              )}
            </CTALinkOrButton>
          </form>
        )}
      </div>
    </Modal>
  );
};
