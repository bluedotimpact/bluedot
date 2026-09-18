import { H1 } from '@bluedot/ui';
import { type Application } from '../lib/client/types';
import { SummaryCard } from './SummaryCard';
import { PreviousApplicationsCard } from './PreviousApplicationsCard';

type ApplicationCardProps = {
  application: Application;
  position: number;
  total: number;
  onProfileOpen?: () => void;
  course: string;
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, position, total, onProfileOpen, course }) => {
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
    commitmentScore,
    commitmentRationale,
    impressivenessScore,
    impressivenessRationale,
    technicalSkillScore,
    technicalSkillRationale,
  } = application;

  const subtitle = [jobTitle, organisation, careerLevel].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div>
          <H1 className="text-size-lg text-primary">{name}</H1>
          {subtitle && (
            <p className="text-size-sm text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" onClick={onProfileOpen} className="px-3 py-2 sm:py-1.5 rounded-lg text-size-sm font-medium border border-strong text-primary bg-tint hover:bg-active transition-colors">
              LinkedIn
            </a>
          )}
          {otherProfileUrl && (
            <a href={otherProfileUrl} target="_blank" rel="noopener noreferrer" onClick={onProfileOpen} className="px-3 py-2 sm:py-1.5 rounded-lg text-size-sm font-medium border border-strong text-primary bg-tint hover:bg-active transition-colors">
              Profile
            </a>
          )}
        </div>
      </div>

      <PreviousApplicationsCard applicationId={application.id} course={course} />

      {(!!aiSummary
        || commitmentScore !== undefined
        || impressivenessScore !== undefined
        || technicalSkillScore !== undefined
        || !!commitmentRationale
        || !!impressivenessRationale
        || !!technicalSkillRationale) && (
        <SummaryCard
          aiSummary={aiSummary ?? ''}
          course={course}
          commitmentScore={commitmentScore}
          commitmentRationale={commitmentRationale}
          impressivenessScore={impressivenessScore}
          impressivenessRationale={impressivenessRationale}
          technicalSkillScore={technicalSkillScore}
          technicalSkillRationale={technicalSkillRationale}
        />
      )}

      <div className="border border-subtle rounded-lg divide-y divide-stone-700 overflow-hidden">
        {([
          { title: 'Path to impact', content: pathToImpact },
          { title: 'Experience', content: experience },
          { title: 'Skills', content: skills },
          { title: 'Impressive project', content: impressiveProject },
          { title: 'Reasoning', content: reasoning },
        ] as const).filter(({ content }) => content).map(({ title, content }) => (
          <details key={title} className="group">
            <summary className="min-h-11 flex items-center justify-between px-4 py-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-size-sm font-semibold font-sans text-primary">{title}</span>
              <svg className="size-4 text-secondary transition-transform group-open:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="px-4 pb-3 text-size-sm text-primary leading-relaxed whitespace-pre-wrap">{content}</p>
          </details>
        ))}
      </div>

      {(applicationSource ?? utmSource) && (
        <div className="text-size-xs text-secondary space-y-0.5 break-words overflow-hidden">
          {applicationSource && <p>Heard about us: {applicationSource}</p>}
          {utmSource && <p>UTM source: {utmSource}</p>}
        </div>
      )}

      <p className="text-size-xs text-secondary text-right">{position} of {total}</p>
    </div>
  );
};
