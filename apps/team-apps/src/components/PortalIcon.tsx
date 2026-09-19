import type { SVGProps } from 'react';

export type IconName = 'home' | 'review' | 'talent' | 'panel' | 'menu' | 'arrow' | 'external' | 'logout';
const paths: Record<IconName, React.ReactNode> = {
  home: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  review: <><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M15 3h6v6M21 3 11 13" /><path d="m7 15 2 2 5-5" /></>,
  talent: <><circle cx="9" cy="7" r="3" /><path d="M3 20v-2a6 6 0 0 1 10-4.5M16 4h5v16l-2.5-2-2.5 2V4Z" /></>,
  external: <><path d="M14 3h7v7m0-7L10 14" /><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16m6-12-3 4 3 4" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M10 12h11m-4-4 4 4-4 4" /></>,
};
export const PortalIcon = ({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>
);
