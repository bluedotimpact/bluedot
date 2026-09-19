import type { Person, QueueItem } from '../types';
import { courses } from './model';

const names = ['Alex Morgan', 'Sam Chen', 'Jamie Rivera', 'Taylor Okafor', 'Jordan Patel', 'Casey Nguyen', 'Robin Ahmed', 'Drew Park', 'Riley Williams', 'Avery Khan', 'Morgan Ellis', 'Charlie Lewis'];
export const demoPeople: Person[] = names.map((name, index) => {
  const course = courses[Math.floor(index / 4)]!;
  const recent = index % 4 < 2;
  const roundName = `${course} (${recent ? '2026 Aug W32' : '2026 Jun W23'}) - Part-time`;
  const id = `demo-scout-${index}`;
  return {
    id, name, course, roundName, email: `${name.toLowerCase().replace(' ', '.')}@example.org`,
    roundEnd: recent ? '2026-09-01' : '2026-07-01', opinion: 'Weak yes',
    jobTitle: ['Research engineer', 'Graduate student', 'Policy researcher', 'Software engineer'][index % 4],
    organisation: 'Example Research Institute', country: 'United Kingdom',
    history: [{
      id, course, roundName, hasCertificate: index % 3 !== 2, droppedOut: false, isCurrent: true, facilitated: false,
    }],
    grants: [], calls: [],
    reports: index % 3 === 1 ? [] : [{ id: `report-${index}`, quickTake: 'Asked precise questions, followed up with a working experiment, and helped peers understand the results.', nextSteps: ['Schedule follow-up call with BlueDot team within ~1 week (high-priority)'] }],
    facilitatorFeedback: [{
      id: `feedback-${index}`, reviewer: 'Example facilitator', rating: 8, feedback: 'Strong independent work and clear reasoning. Worth a conversation about practical next steps.', nextSteps: [], recommendToFacilitate: false,
    }],
    projects: [{ id: `project-${index}`, title: 'Evaluating reliability under distribution shift', evalNotes: ['Clear research question and careful discussion of what the results do and do not establish.'] }],
    feedback: [],
    application: {
      id: `application-${index}`, experience: 'Three years building research software. Recently ran a reading group and published reproducible experiments.', pathToImpact: 'I want to contribute reliable evaluation tools to a safety research team.', skills: 'Python, experimental design, and communicating technical results.',
    },
  };
});
export const demoQueue: QueueItem[] = demoPeople.map((person, index) => ({
  id: person.id, name: person.name, course: person.course, roundName: person.roundName,
  roundId: `demo-round-${Math.floor(index / 2)}`, roundEnd: person.roundEnd, opinion: person.opinion,
  hasCertificate: person.history[0]!.hasCertificate, hasReport: person.reports.length > 0,
}));
