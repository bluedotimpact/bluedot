export type PageState =
  | { name: 'select'; groupId: string }
  | { name: 'appJoin'; meetingNumber: string; meetingPassword: string; meetingHostKey?: string; activityDoc?: string };
