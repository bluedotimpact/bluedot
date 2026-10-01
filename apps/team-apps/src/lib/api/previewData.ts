import createHttpError from 'http-errors';
import type {
  Application, ApplicationTile, FilterOption, QueueFilters,
} from '../client/types';
import type { DecisionEmailCounts, Round, RoundStats } from './airtable';

const rounds: Round[] = [
  { id: 'recPreviewRound01', name: 'AGI Strategy (sample round)', course: 'AGI Strategy' },
  { id: 'recPreviewRound02', name: 'Technical AI Safety (sample round)', course: 'Technical AI Safety' },
  { id: 'recPreviewRound03', name: 'Technical AI Safety Project (sample round)', course: 'Technical AI Safety Project' },
];
const people: Application[] = [
  {
    id: 'recSamplePerson01', name: 'Alex Morgan', jobTitle: 'Policy researcher', organisation: 'Example Institute', experience: 'Three years researching technology policy and public sector procurement. Led a cross-functional project comparing AI assurance approaches.', pathToImpact: 'Help public institutions evaluate advanced AI systems and make better procurement decisions.', impressiveProject: 'Built an open assessment framework used by a small group of public sector researchers.', reasoning: 'I want a stronger technical grounding to connect my policy work with practical questions about model evaluations.', skills: 'Research design, policy analysis, stakeholder interviews.', totalScore: 12, commitmentScore: 4, impressivenessScore: 4, technicalSkillScore: 4, allowMoveToAgisc: true, allowMoveToTais: true, alsoAppliedToFacilitate: true,
  },
  {
    id: 'recSamplePerson02', name: 'Sam Chen', jobTitle: 'Software engineer', organisation: 'Example Labs', experience: 'Develops infrastructure for machine learning experiments. Recently started an independent reading group on interpretability.', pathToImpact: 'Build evaluation infrastructure that makes safety research faster and easier to reproduce.', impressiveProject: 'Created a reproducible benchmark for comparing changes in model behavior across training runs.', totalScore: 11, commitmentScore: 4, impressivenessScore: 4, technicalSkillScore: 3, allowMoveToAgisc: true,
  },
  {
    id: 'recSamplePerson03', name: 'Jordan Patel', jobTitle: 'Graduate researcher', organisation: 'Example University', experience: 'Studies economics and the governance of emerging technologies.', pathToImpact: 'Contribute empirical research on the incentives shaping AI development.', totalScore: 10, allowMoveToAgisc: false, allowMoveToTais: true,
  },
  {
    id: 'recSamplePerson05', name: 'Morgan Lee', jobTitle: 'Data analyst', organisation: 'Example Agency', experience: 'Builds reporting pipelines for a public health agency.', pathToImpact: 'Apply data infrastructure skills to biosecurity monitoring.',
  },
  {
    id: 'recSamplePerson04', name: 'Riley Williams', jobTitle: 'Program manager', organisation: 'Example Foundation', experience: 'Coordinates research grants and supports teams working on technology governance.', pathToImpact: 'Help promising research projects reach the people who can use their findings.', totalScore: 9, allowMoveToAgisc: true,
  },
];

// Each sample option matches a fixed set of sample applicants, so any and all
// give different queues: any of both → 01, 02, 03; all of both → 03. Both
// show as tiles, in different tones.
const filterOptions: (ApplicationTile & { matches: string[] })[] = [
  {
    id: 'recPreviewFilterA', label: 'Sample filter A', tone: 'caution', matches: ['recSamplePerson01', 'recSamplePerson03'],
  },
  {
    id: 'recPreviewFilterB', label: 'Sample filter B', tone: 'positive', matches: ['recSamplePerson02', 'recSamplePerson03'],
  },
];

const withTiles = (person: Application): Application => {
  const tiles = filterOptions.filter((option) => option.matches.includes(person.id)).map(({ id, label, tone }) => ({ id, label, tone }));
  return tiles.length > 0 ? { ...person, tiles } : person;
};

const matchesFilters = (person: Application, filters?: QueueFilters): boolean => {
  if (!filters?.optionIds.length) return true;
  const hits = filters.optionIds.map((id) => {
    const option = filterOptions.find((candidate) => candidate.id === id);
    if (!option) throw createHttpError(400, 'A selected filter is no longer available. Choose your filters again.', { expose: true });
    return option.matches.includes(person.id);
  });
  return filters.mode === 'all' ? hits.every(Boolean) : hits.some(Boolean);
};

type PreviewState = { opinions: Record<string, { opinion: string; decision: string }>; moved: Record<string, string>; emailsSent: Record<string, true> };
const previewGlobal = globalThis as typeof globalThis & { blueDotAppsPreview?: PreviewState };
const state = () => {
  previewGlobal.blueDotAppsPreview ??= { opinions: {}, moved: {}, emailsSent: {} };
  // Next.js hot reload can preserve a state object created before emailsSent existed.
  previewGlobal.blueDotAppsPreview.emailsSent ??= {};
  return previewGlobal.blueDotAppsPreview;
};

export const previewData = {
  fetchRounds: async () => rounds,
  fetchFilterOptions: async (): Promise<FilterOption[]> => filterOptions.map(({ id, label }) => ({ id, label })),
  fetchApplications: async (_round: string, _offset?: string, direction = 'top', filters?: QueueFilters) => ({
    // Unscored applications sort last in either direction, matching the real
    // adapter's scored-then-unscored phases.
    applications: people.filter((person) => matchesFilters(person, filters) && !state().opinions[person.id] && !state().moved[person.id]).sort((a, b) => {
      if (a.totalScore === undefined && b.totalScore === undefined) return 0;
      if (a.totalScore === undefined) return 1;
      if (b.totalScore === undefined) return -1;
      return direction === 'bottom' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
    }).map(withTiles),
  }),
  fetchApplicationHistory: async () => [],
  fetchRoundStats: async (): Promise<RoundStats> => ({ total: people.length, evaluated: Object.keys(state().opinions).length, accepted: Object.values(state().opinions).filter((opinion) => opinion.decision === 'Accept').length }),
  writeOpinions: async (opinions: { id: string; opinion: string; decision: string }[]) => {
    opinions.forEach(({ id, ...opinion }) => {
      state().opinions[id] = opinion;
    });
  },
  resetOpinion: async (id: string) => {
    delete state().opinions[id];
  },
  moveApplication: async (id: string, round: string) => {
    state().moved[id] = round;
  },
  undoMove: async (id: string) => {
    delete state().moved[id];
  },
  fetchDecisionEmailCounts: async (): Promise<DecisionEmailCounts> => {
    const { opinions, emailsSent } = state();
    const reviewedIds = Object.keys(opinions);
    const pendingIds = reviewedIds.filter((id) => !emailsSent[id]);
    const pendingAccepted = pendingIds.filter((id) => opinions[id]?.decision === 'Accept').length;
    return {
      reviewed: reviewedIds.length,
      alreadySent: reviewedIds.length - pendingIds.length,
      // Preview has no automation delay: flagged means sent.
      confirmedSent: reviewedIds.length - pendingIds.length,
      pending: pendingIds.length,
      pendingAccepted,
      pendingRejected: pendingIds.length - pendingAccepted,
    };
  },
  flagDecisionEmails: async (applicationIds?: string[]): Promise<{ flagged: number }> => {
    const scope = applicationIds ? new Set(applicationIds) : undefined;
    const pending = Object.keys(state().opinions).filter((id) => !state().emailsSent[id] && (!scope || scope.has(id)));
    pending.forEach((id) => {
      state().emailsSent[id] = true;
    });
    return { flagged: pending.length };
  },
};
