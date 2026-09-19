import type { IconName } from '../components/PortalIcon';

export type PortalApp = {
  id: string;
  icon: IconName;
  name: string;
  description: string;
  href: string;
  external?: boolean;
};

export const apps: PortalApp[] = [{
  id: 'scout',
  icon: 'scout',
  name: 'Scout',
  description: 'Review course participants and invite promising people to an evaluation call.',
  href: '/scout',
}, {
  id: 'speed-review',
  icon: 'review',
  name: 'Speed Reviewer',
  description: 'Review course applications in focused, timed sessions.',
  href: '/speed-review',
}, {
  id: 'talent-capture',
  icon: 'talent',
  name: 'Talent Capture',
  description: 'Save LinkedIn profiles to BlueDot\'s Top Talent CRM with our Chrome extension.',
  href: 'https://chromewebstore.google.com/detail/add-to-top-talent-crm/pabfnkpcbfplnhpccofejgmcbihlahjo',
  external: true,
}];
