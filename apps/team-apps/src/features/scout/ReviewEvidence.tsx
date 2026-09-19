import { useState, type ReactNode } from 'react';
import type { Person, QueueItem } from './types';
import { PersonCard } from './PersonCard';
import { roundLabel } from './reviewQueue';
import { button, panel } from './reviewStyles';

export const ReviewEvidence = ({ item, person, error, onRetry, actions, status }: { item: QueueItem; person?: Person; error?: string; onRetry: () => void; actions: ReactNode; status?: ReactNode }) => {
  const [tab, setTab] = useState('brief');
  return (
    <section aria-label="Participant evidence" className={panel}>
      <div className="border-b border-subtle p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-size-xs font-medium uppercase tracking-widest text-secondary">Consider for an evaluation call</p>{status}</div>
        <h2 className="mt-3 break-words text-size-lg font-semibold">{item.name ?? person?.name ?? 'Participant'}</h2>
        {person && <p className="mt-1 text-size-sm leading-relaxed text-secondary">{[person.jobTitle, person.organisation, person.country].filter(Boolean).join(' · ')}</p>}
        <p className="mt-2 text-size-xs text-secondary">{item.course} · {roundLabel(item)}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-size-xs"><span className="rounded-surface bg-tint px-2 py-1">Recorded opinion: {item.opinion ?? 'Not recorded'}</span><span className="rounded-surface bg-tint px-2 py-1">{item.hasCertificate ? 'Certificate issued' : 'No certificate recorded'}</span></div>
        {person && person.calls.length > 0 && <p className="mt-3 rounded-surface border border-warning-border bg-warning-bg p-3 text-size-xs leading-relaxed text-warning-fg">Already has {person.calls.length} evaluation call record{person.calls.length === 1 ? '' : 's'}. Check the history before arranging another call.</p>}
      </div>
      <div role="group" aria-label="Evidence sections" className="flex flex-wrap gap-1 border-b border-subtle px-4 py-2">{[{ id: 'brief', label: 'Decision brief' }, { id: 'full', label: 'Full record' }].map((section) => <button key={section.id} type="button" aria-pressed={tab === section.id} className={`min-h-11 rounded-surface px-3 text-size-sm font-medium ${tab === section.id ? 'bg-info-bg text-accent' : 'text-secondary hover:bg-tint'}`} onClick={() => setTab(section.id)}>{section.label}</button>)}</div>
      <div className="space-y-5 p-5 sm:p-6">
        {!person && !error && <p role="status" className="text-size-sm text-secondary">Loading their evidence…</p>}
        {error && <div role="alert"><p className="text-size-sm">{error}</p><button type="button" className={`${button} mt-3`} onClick={onRetry}>Retry participant</button></div>}
        {person && (tab === 'full' ? <PersonCard person={person} showName /> : <>
          <p className="text-size-xs text-secondary">Original notes from the record. No AI summary or new score.</p>
          <Evidence title="What their facilitator noticed" empty="No written facilitator assessment is available.">{person.reports.map((report) => report.quickTake).filter(Boolean).concat(person.facilitatorFeedback.map((feedback) => feedback.feedback).filter(Boolean)).slice(0, 2).map((text, index) => <p key={`${index}-${text}`}>{text}</p>)}</Evidence>
          <Evidence title="What they made" empty="No project notes are available.">{person.projects.slice(0, 2).map((project) => <div key={project.id}><p className="font-medium text-primary">{project.title ?? 'Project'}</p>{project.evalNotes.slice(0, 1).map((note) => <p key={note} className="mt-1">{note}</p>)}</div>)}</Evidence>
          <Evidence title="Suggested next steps" empty="No next steps recorded.">{[...new Set([...person.reports.flatMap((report) => report.nextSteps), ...person.facilitatorFeedback.flatMap((feedback) => feedback.nextSteps)])].map((step) => <p key={step}>{step}</p>)}</Evidence>
          <details className="border-t border-subtle"><summary className="min-h-11 cursor-pointer py-3 text-size-sm font-medium">Their motivation and experience</summary><div className="space-y-4 pb-2"><Evidence title="What they want to do" empty="Not recorded.">{person.application?.pathToImpact ? <p>{person.application.pathToImpact}</p> : null}</Evidence><Evidence title="Experience" empty="Not recorded.">{person.application?.experience ? <p>{person.application.experience}</p> : null}</Evidence></div></details>
        </>)}
      </div>
      {actions}
    </section>
  );
};

const Evidence = ({ title, empty, children }: { title: string; empty: string; children: ReactNode }) => <section><h3 className="mb-2 text-size-sm font-semibold">{title}</h3><div className="max-w-prose space-y-3 whitespace-pre-wrap break-words text-size-sm leading-relaxed text-secondary">{children && (!Array.isArray(children) || children.length > 0) ? children : <p>{empty}</p>}</div></section>;
