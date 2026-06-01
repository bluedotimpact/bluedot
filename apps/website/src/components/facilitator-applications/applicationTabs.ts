import type { FacilitatorApplicationListItem } from '../../server/routers/facilitator-applications';

export const APPLICATION_TABS = [
  { id: 'active', label: 'Active' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'pending', label: 'Pending' },
  { id: 'past', label: 'Past' },
] as const;

export type ApplicationTab = (typeof APPLICATION_TABS)[number]['id'];

const TAB_IDS = new Set<string>(APPLICATION_TABS.map((t) => t.id));

export const isApplicationTab = (v: unknown): v is ApplicationTab => typeof v === 'string' && TAB_IDS.has(v);

export type ApplicationStatus = 'pending' | 'accepted' | 'pastAccepted' | 'withdrawn' | 'notPlaced';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  pastAccepted: 'Past - Accepted',
  withdrawn: 'Withdrawn',
  notPlaced: 'Past - Not Placed',
};

export const getApplicationStatus = (application: FacilitatorApplicationListItem): ApplicationStatus => {
  switch (application.decision) {
    case 'Withdrawn':
      return 'withdrawn';
    case 'Reject':
      return 'notPlaced';
    case 'Accept':
      return application.roundStatus === 'Past' ? 'pastAccepted' : 'accepted';
    default:
      return application.roundStatus === 'Past' ? 'notPlaced' : 'pending';
  }
};

const isPast = (a: FacilitatorApplicationListItem): boolean => a.roundStatus === 'Past';
const isInFlight = (a: FacilitatorApplicationListItem): boolean =>
  a.roundStatus === 'Active' || a.roundStatus === 'Future';

const TAB_PREDICATES: Record<ApplicationTab, (a: FacilitatorApplicationListItem) => boolean> = {
  // In-flight applications still in play (not withdrawn, not rejected — those are terminal).
  active: (a) => isInFlight(a) && a.decision !== 'Withdrawn' && a.decision !== 'Reject',
  accepted: (a) => isInFlight(a) && a.decision === 'Accept',
  pending: (a) => isInFlight(a) && a.decision == null,
  // Past rounds OR any terminal decision (withdrawn / rejected) regardless of round status.
  past: (a) => isPast(a) || a.decision === 'Withdrawn' || a.decision === 'Reject',
};

export const filterByTab = (
  applications: FacilitatorApplicationListItem[],
  tab: ApplicationTab,
): FacilitatorApplicationListItem[] => applications.filter(TAB_PREDICATES[tab]);
