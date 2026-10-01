import { H1 } from '@bluedot/ui';
import { FaChevronDown } from 'react-icons/fa6';
import { type Application, type TileTone } from '../lib/client/types';
import { SummaryCard } from './SummaryCard';
import { PreviousApplicationsCard } from './PreviousApplicationsCard';

const TILE_TONE_CLASSES: Record<TileTone, string> = {
  neutral: 'border-subtle bg-tint text-secondary',
  positive: 'border-info-border bg-info-bg text-info-fg',
  caution: 'border-warning-border bg-warning-bg text-warning-fg',
};

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
    tiles,
  } = application;

  const subtitle = [jobTitle, organisation, careerLevel].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <H1 className="text-size-lg text-primary">{name}</H1>
          {subtitle && (
            <p className="text-size-sm text-secondary mt-0.5">{subtitle}</p>
          )}
          {tiles && tiles.length > 0 && (
            <ul aria-label="Tags" className="flex flex-wrap gap-1.5 mt-2">
              {tiles.map((tile) => (
                <li key={tile.id} className={`rounded-full border px-2 py-0.5 text-size-xs font-medium break-words ${TILE_TONE_CLASSES[tile.tone]}`}>
                  {tile.label}
                </li>
              ))}
            </ul>
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
              <FaChevronDown className="size-2.5 text-secondary transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <p className="px-4 pb-3 text-size-sm text-primary leading-relaxed whitespace-pre-wrap">{content}</p>
          </details>
        ))}
      </div>

      {(applicationSource ?? utmSource ?? application.alsoAppliedToFacilitate) && (
        <div className="text-size-xs text-secondary space-y-0.5 break-words overflow-hidden">
          {application.alsoAppliedToFacilitate && <p>Also applied to facilitate</p>}
          {applicationSource && <p>Heard about us: {applicationSource}</p>}
          {utmSource && <p>UTM source: {utmSource}</p>}
        </div>
      )}

      <p className="text-size-xs text-secondary text-right">{position} of {total}</p>
    </div>
  );
};
