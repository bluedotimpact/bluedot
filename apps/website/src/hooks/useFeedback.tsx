import { useAuthStore, type FeedbackData } from '@bluedot/ui';
import dynamic from 'next/dynamic';
import {
  createContext, useContext, useEffect, useState,
} from 'react';
import { ModalLoadingFallback } from '../components/ModalLoadingFallback';
import { toBase64 } from '../utils/toBase64';
import { trpc } from '../utils/trpc';

const FeedbackModal = dynamic(() => import('@bluedot/ui/src/FeedbackModal').then((m) => m.FeedbackModal), {
  loading: ModalLoadingFallback,
});

type FeedbackContextType = {
  openFeedback: () => void;
};

const feedbackContext = createContext<FeedbackContextType | null>(null);

const getPageUrl = () => window.location.origin + window.location.pathname;

// eslint-disable-next-line react/function-component-definition
export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | undefined>();
  const [pageUrl, setPageUrl] = useState<string | undefined>();
  // Mount on first open, then stay mounted: the modal keeps the draft across close/reopen
  // (e.g. closing to record the screen with Birdie), which unmounting would discard.
  const [hasOpened, setHasOpened] = useState(false);
  if (isFeedbackOpen && !hasOpened) setHasOpened(true);

  const submitFeedbackMutation = trpc.feedback.submit.useMutation();
  // The logged-in user's own email, which is the admin's rather than the target's when impersonating
  const authEmail = useAuthStore((s) => s.auth?.email);

  // Birdie setup
  useEffect(() => {
    if (window.innerWidth <= 768) return;
    if (window.birdie) return;

    window.birdieSettings = {
      app_id: '4adrhn9g',
      onRecordingPosted: (url) => setRecordingUrl(url),
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://app.birdie.so/widget/${window.birdieSettings.app_id}`;
    document.body.appendChild(script);

    return () => {
      if (script) document.body.removeChild(script);
    };
  }, []);

  // Auto-open feedback modal when recording completes and recording URL is available.
  // Recapture the page here: the page they stopped recording on is the most relevant one.
  useEffect(() => {
    if (recordingUrl) {
      setPageUrl(getPageUrl());
      setIsFeedbackOpen(true);
    }
  }, [recordingUrl]);

  const handleFeedbackSubmit = async (data: FeedbackData) => {
    await submitFeedbackMutation.mutateAsync({
      description: data.description,
      email: data.email,
      recordingUrl: data.recordingUrl,
      pageUrl,
      attachments: await Promise.all(data.attachments?.map(async (file) => ({
        base64: (await toBase64(file)).split(',')[1] ?? '',
        filename: file.name,
        mimeType: file.type,
      })) ?? []),
    });
  };

  const handleSetFeedbackOpen = (v: boolean) => {
    setIsFeedbackOpen(v);
    if (!v) setRecordingUrl(undefined);
  };

  const openFeedback = () => {
    setPageUrl(getPageUrl());
    setIsFeedbackOpen(true);
  };

  const handleRecordScreen = () => {
    if (!window.birdie) return;
    setIsFeedbackOpen(false);
    // Use `setTimeout` to ensure the feedback modal has closed before opening the Birdie widget (also a modal), preventing
    // potential UI and focus conflicts.
    setTimeout(() => window.birdie?.widget.open());
  };

  return (
    <feedbackContext.Provider value={{ openFeedback }}>
      {children}
      {hasOpened && (
        <FeedbackModal
          isOpen={isFeedbackOpen}
          setIsOpen={handleSetFeedbackOpen}
          onRecordScreen={handleRecordScreen}
          onSubmit={handleFeedbackSubmit}
          recordingUrl={recordingUrl}
          defaultEmail={authEmail}
        />
      )}
    </feedbackContext.Provider>
  );
}

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(feedbackContext);
  if (!context) {
    // eslint-disable-next-line no-console
    console.warn('useFeedback: No FeedbackProvider found. Feedback will be unavailable.');
    return { openFeedback: () => {} };
  }

  return context;
};
