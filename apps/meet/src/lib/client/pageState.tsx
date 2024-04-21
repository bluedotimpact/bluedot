export type PageState =
  | { name: 'select', cohortId: string }
  | { name: 'custom', cohortClassId: string }
  | { name: 'room', jwt: string, participantName: string, meetingNumber: string, meetingPassword: string }
  | { name: 'appJoin', meetingNumber: string, meetingPassword: string, meetingHostKey?: string };
