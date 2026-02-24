export {};

declare global {
  // `interface` is required here for declaration merging with the global Window type
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    birdie?: {
      widget: {
        opened: () => boolean;
        open: () => void;
        close: () => void;
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
