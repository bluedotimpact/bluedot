import { type Application } from '../lib/client/types';
import { SummaryCard } from './SummaryCard';

type ApplicationCardProps = {
  application: Application;
  position: number;
  total: number;
  onProfileOpen?: () => void;
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, position, total, onProfileOpen }) => {
  const {
    name,
    profileUrl,
    otherProfileUrl,
    jobTitle,
    organisation,
    careerLevel,
    aiSummary,
    pathToImpact,
    experience,
    skills,
    impressiveProject,
    reasoning,
    applicationSource,
    utmSource,
  } = application;

  const subtitle = [jobTitle, organisation, careerLevel].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">{name}</h1>
          {subtitle && (
            <p className="text-size-sm text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" onClick={onProfileOpen} className="px-3 py-1.5 rounded-lg text-size-sm font-medium border border-stone-600 text-stone-300 bg-stone-800 hover:bg-stone-700 transition-colors">
              LinkedIn
            </a>
          )}
          {otherProfileUrl && (
            <a href={otherProfileUrl} target="_blank" rel="noopener noreferrer" onClick={onProfileOpen} className="px-3 py-1.5 rounded-lg text-size-sm font-medium border border-stone-600 text-stone-300 bg-stone-800 hover:bg-stone-700 transition-colors">
              Profile
            </a>
          )}
        </div>
      </div>

      {aiSummary && <SummaryCard aiSummary={aiSummary} />}

      <div className="border border-stone-700 rounded-lg divide-y divide-stone-700 overflow-hidden">
        {([
          { title: 'Path to impact', content: pathToImpact },
          { title: 'Experience', content: experience },
          { title: 'Skills', content: skills },
          { title: 'Impressive project', content: impressiveProject },
          { title: 'Reasoning', content: reasoning },
        ] as const).filter(({ content }) => content).map(({ title, content }) => (
          <details key={title} className="group">
            <summary className="flex items-center justify-between px-4 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-size-sm font-semibold font-mono text-stone-300">{title}</span>
              <svg className="size-4 text-stone-500 transition-transform group-open:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="px-4 pb-3 text-size-sm text-stone-300 leading-relaxed whitespace-pre-wrap">{content}</p>
          </details>
        ))}
      </div>

      {(applicationSource ?? utmSource) && (
        <div className="text-size-xs text-stone-500 space-y-0.5">
          {applicationSource && <p>Heard about us: {applicationSource}</p>}
          {utmSource && <p>UTM source: {utmSource}</p>}
        </div>
      )}

      <p className="text-size-xs text-stone-500 text-right">{position} of {total}</p>
    </div>
  );
};
