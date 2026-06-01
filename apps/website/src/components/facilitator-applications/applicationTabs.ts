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
  // All in-flight applications, any decision (except withdrawn which falls to Past in the visual design).
  active: (a) => isInFlight(a) && a.decision !== 'Withdrawn',
  accepted: (a) => isInFlight(a) && a.decision === 'Accept',
  pending: (a) => isInFlight(a) && a.decision == null,
  // Past rounds AND any withdrawn (regardless of round status).
  past: (a) => isPast(a) || a.decision === 'Withdrawn',
};

export const filterByTab = (
  applications: FacilitatorApplicationListItem[],
  tab: ApplicationTab,
): FacilitatorApplicationListItem[] => applications.filter(TAB_PREDICATES[tab]);
