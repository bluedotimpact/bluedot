export {};

declare global {
  interface Window {
    birdie?: {
      widget: {
        opened: () => boolean;
        open: () => void;
        close: () => void;
        toggle: () => void;
      };
    };
    birdieSettings: {
      app_id: string;
      contact_name?: string | null;
      contact_email?: string | null;
      contact_id?: string;
      onRecorderOpened?: () => void;
      onRecorderClosed?: () => void;
      onRecordingStarted?: () => void;
      onRecordingStopped?: () => void;
      onRecordingPosted?: (url: string) => void;
      autoclose_recorder?: boolean;
    };
  }
}
