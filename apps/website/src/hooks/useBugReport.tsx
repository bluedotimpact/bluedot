import { useAuthStore, type FeedbackData } from '@bluedot/ui';
import dynamic from 'next/dynamic';
import {
  createContext, useContext, useEffect, useState,
} from 'react';
import { ModalLoadingFallback } from '../components/ModalLoadingFallback';
import { toBase64 } from '../utils/toBase64';
import { trpc } from '../utils/trpc';

const BugReportModal = dynamic(() => import('@bluedot/ui/src/BugReportModal').then((m) => m.BugReportModal), {
  loading: ModalLoadingFallback,
});

type BugReportContextType = {
  openBugReport: () => void;
};

const bugReportContext = createContext<BugReportContextType | null>(null);

const getPageUrl = () => window.location.origin + window.location.pathname;

// eslint-disable-next-line react/function-component-definition
export default function BugReportProvider({ children }: { children: React.ReactNode }) {
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | undefined>();
  const [pageUrl, setPageUrl] = useState<string | undefined>();
  // Mount on first open, then stay mounted: the modal keeps the draft across close/reopen
  // (e.g. closing to record the screen with Birdie), which unmounting would discard.
  const [hasOpened, setHasOpened] = useState(false);
  if (isBugReportOpen && !hasOpened) setHasOpened(true);

  const submitBugMutation = trpc.feedback.submitBugReport.useMutation();
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

  // Auto-open bug report modal when recording completes and recording URL is available.
  // Recapture the page here: the page they stopped recording on is the most relevant one.
  useEffect(() => {
    if (recordingUrl) {
      setPageUrl(getPageUrl());
      setIsBugReportOpen(true);
    }
  }, [recordingUrl]);

  const handleBugReportSubmit = async (data: FeedbackData) => {
    await submitBugMutation.mutateAsync({
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

  const handleSetBugReportOpen = (v: boolean) => {
    setIsBugReportOpen(v);
    if (!v) setRecordingUrl(undefined);
  };

  const openBugReport = () => {
    setPageUrl(getPageUrl());
    setIsBugReportOpen(true);
  };

  const handleRecordScreen = () => {
    if (!window.birdie) return;
    setIsBugReportOpen(false);
    // Use `setTimeout` to ensure the bug modal has closed before opening the Birdie widget (also a modal), preventing
    // potential UI and focus conflicts.
    setTimeout(() => window.birdie?.widget.open());
  };

  return (
    <bugReportContext.Provider value={{ openBugReport }}>
      {children}
      {hasOpened && (
        <BugReportModal
          isOpen={isBugReportOpen}
          setIsOpen={handleSetBugReportOpen}
          onRecordScreen={handleRecordScreen}
          onSubmit={handleBugReportSubmit}
          recordingUrl={recordingUrl}
          defaultEmail={authEmail}
        />
      )}
    </bugReportContext.Provider>
  );
}

export const useBugReport = (): BugReportContextType => {
  const context = useContext(bugReportContext);
  if (!context) {
    // eslint-disable-next-line no-console
    console.warn('useBugReport: No BugReportProvider found. Bug reporting will be unavailable.');
    return { openBugReport: () => {} };
  }

  return context;
};
