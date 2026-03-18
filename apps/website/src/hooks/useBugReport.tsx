import { BugReportModal, type FeedbackData } from '@bluedot/ui';
import {
  createContext, useContext, useEffect, useState,
} from 'react';
import { toBase64 } from '../utils/toBase64';
import { trpc } from '../utils/trpc';

type BugReportContextType = {
  openBugReport: () => void;
};

const bugReportContext = createContext<BugReportContextType | null>(null);

// eslint-disable-next-line react/function-component-definition
export default function BugReportProvider({ children }: { children: React.ReactNode }) {
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | undefined>();

  const submitBugMutation = trpc.feedback.submitBugReport.useMutation();

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

  // Auto-open bug report modal when recording completes and recording URL is available
  useEffect(() => {
    if (recordingUrl) {
      setIsBugReportOpen(true);
    }
  }, [recordingUrl]);

  const handleBugReportSubmit = async (data: FeedbackData) => {
    await submitBugMutation.mutateAsync({
      description: data.description,
      email: data.email,
      recordingUrl: data.recordingUrl,
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

  const handleRecordScreen = () => {
    if (!window.birdie) return;
    setIsBugReportOpen(false);
    // Use `setTimeout` to ensure the bug modal has closed before opening the Birdie widget (also a modal), preventing
    // potential UI and focus conflicts.
    setTimeout(() => window.birdie?.widget.open());
  };

  return (
    <bugReportContext.Provider value={{ openBugReport: () => setIsBugReportOpen(true) }}>
      {children}
      <BugReportModal
        isOpen={isBugReportOpen}
        setIsOpen={handleSetBugReportOpen}
        onRecordScreen={handleRecordScreen}
        onSubmit={handleBugReportSubmit}
        recordingUrl={recordingUrl}
      />
    </bugReportContext.Provider>
  );
}

export const useBugReport = () => {
  const context = useContext(bugReportContext);
  if (!context) {
    throw new Error('useBugReport must be used within a BugReportProvider');
  }

  return context;
};
