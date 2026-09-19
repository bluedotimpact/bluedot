import type { ReactNode } from 'react';
import type { Draft } from './model';
import { draftLabel } from './model';

import { panel } from '../reviewStyles';

export { button, primary, panel } from '../reviewStyles';
export const field = 'min-h-11 w-full min-w-0 rounded-surface border border-subtle bg-raised px-3 py-2 text-size-sm text-primary';
export const Select = ({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) => (
  <label className="block min-w-0 text-size-xs font-medium text-secondary">{label}<select className={`${field} mt-2`} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>
);
export const Empty = ({ title, text }: { title: string; text: string }) => (
  <div className={`${panel} p-6`}><h2 className="font-semibold">{title}</h2><p className="mt-2 max-w-prose text-size-sm leading-relaxed text-secondary">{text}</p></div>
);
export const DraftBadge = ({ draft }: { draft?: Draft }) => (
  <span className={`inline-flex rounded-full px-2 py-1 text-size-xxs font-medium ${draft === 'shortlist' ? 'bg-info-bg text-info-fg' : 'bg-tint text-secondary'}`}>{draftLabel(draft)}</span>
);
