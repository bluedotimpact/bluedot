export type PageState =
  | { name: 'select', cohortId: string }
  | { name: 'appJoin', meetingNumber: string, meetingPassword: string, meetingHostKey?: string };
