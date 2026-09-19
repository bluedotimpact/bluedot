import { useEffect, useState } from 'react';
import { authFetch } from '../../../lib/client/api';
import type { Person, QueueItem } from '../types';
import { ReviewEvidence } from '../ReviewEvidence';
import { demoPeople } from './demo';
import { type Draft } from './model';
import {
  button, primary, DraftBadge,
} from './ui';

export const EvidencePanel = ({ item, demo, draft, focused = false, onChoose }: { item: QueueItem; demo: boolean; draft?: Draft; focused?: boolean; onChoose: (value: Draft) => void }) => {
  const [person, setPerson] = useState<Person>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setPerson(undefined);
    setError('');
    const request = demo ? Promise.resolve({ person: demoPeople.find((p) => p.id === item.id)! }) : authFetch(`/api/scout/person/${item.id}`).then(async (response) => {
      if (!response.ok) throw new Error('Could not load this participant.');
      return response.json() as Promise<{ person: Person }>;
    });
    void request.then((data) => {
      if (active) setPerson(data.person);
    }).catch(() => {
      if (active) setError('Could not load this participant. Please try again.');
    });
    return () => {
      active = false;
    };
  }, [item.id, demo, retry]);
  return <ReviewEvidence item={item} person={person} error={error} onRetry={() => setRetry((value) => value + 1)} status={<DraftBadge draft={draft} />} actions={<div className="rounded-b-overlay border-t border-subtle bg-canvas p-4"><p className="mb-3 text-size-sm font-medium">Is an evaluation call a useful next step?</p><div className="flex flex-wrap gap-2"><button type="button" disabled={!person} className={primary} onClick={() => onChoose('shortlist')}>{focused ? 'Invite to a call' : 'Add to shortlist'}</button><button type="button" disabled={!person} className={button} onClick={() => onChoose('later')}>{focused ? 'Skip for now' : 'Review later'}</button><button type="button" disabled={!person} className={button} onClick={() => onChoose('pass')}>Don’t invite</button></div><p className="mt-3 text-size-xs leading-relaxed text-secondary">{focused ? 'Invite previews an email confirmation. Skip keeps them for later. Don’t invite records a pass.' : 'Shortlisting sends nothing. Review invitations when your shortlist is ready.'} All choices in this preview are drafts.</p></div>} />;
};
