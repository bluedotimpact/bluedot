import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { PersonCard, mustLookReasons } from './PersonCard';
import { openNextSection } from './sectionNav';
import type { Person } from './types';

afterEach(cleanup);

const person: Person = {
  id: 'recScoutSample001',
  name: 'Sample Participant',
  course: 'Technical AI Safety',
  email: 'sample.participant@example.org',
  roundName: 'Technical AI Safety (2026 Aug W32) - Part-time',
  history: [],
  otherApplications: [],
  grants: [],
  rapidGrants: [{
    id: 'recRapidSample0001', recordUrl: 'https://airtable.example.org/recRapidSample0001', createdAt: '2026-05-01', projectTitle: 'Sample project', opinion: 'Weak yes',
  }],
  calls: [],
  reports: [],
  facilitatorFeedback: [],
  sessions: [{
    id: 'recSessionSample01', unit: 1, topic: 'Sample topic', group: 1, attended: true,
  }],
  projects: [],
  feedback: [],
};

test('a timeline row with details opens on a click anywhere on it; the link and the opened details keep their own clicks', () => {
  render(<PersonCard person={person} showName />);
  expect(screen.queryByText('Sample project')).toBeNull();
  fireEvent.click(screen.getByText('Rapid grant'));
  expect(screen.getByText('Sample project')).toBeTruthy();
  fireEvent.click(screen.getByText('Sample project'));
  expect(screen.getByText('Sample project')).toBeTruthy();
  fireEvent.click(screen.getByTitle('Open the record in Airtable'));
  expect(screen.getByText('Sample project')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Hide details' }));
  expect(screen.queryByText('Sample project')).toBeNull();
});

test('openNextSection walks the top-level sections one at a time: closes the open one, opens the next, then starts over', () => {
  render(<PersonCard person={person} showName />);
  const tops = () => [...document.querySelectorAll('details')].filter((d) => !d.parentElement?.closest('details'));
  const openIndexes = () => tops().map((d, i) => (d.open ? i : -1)).filter((i) => i >= 0);
  expect(tops().length).toBeGreaterThanOrEqual(2);
  const [first] = openIndexes();
  expect(first).toBeDefined();
  openNextSection(document);
  expect(openIndexes()).toEqual(first! + 1 < tops().length ? [first! + 1] : []);
  tops().forEach((d) => {
    d.open = false;
  });
  openNextSection(document);
  expect(openIndexes()).toEqual([0]);
});

test('the AI summary sits at the top of the card as a list, an older prose summary as a paragraph, and the AI take is not shown', () => {
  render(<PersonCard person={{ ...person, aiSummary: '- Built a thing last month\n- Wants to work on evals', aiTake: 'Worth a look: yes\nWhy: Built a thing.' }} showName />);
  expect(screen.getByText('Built a thing last month').tagName).toBe('LI');
  expect(screen.getByText('Wants to work on evals').tagName).toBe('LI');
  expect(screen.queryByText(/Worth a look/)).toBeNull();
  cleanup();
  render(<PersonCard person={{ ...person, aiSummary: 'Built a thing last month.' }} showName />);
  expect(screen.getByText('Built a thing last month.').tagName).toBe('P');
  expect(screen.getByText('AI summary')).toBeTruthy();
  cleanup();
  render(<PersonCard person={person} showName />);
  expect(screen.queryByText(/Built a thing/)).toBeNull();
});

test('each facilitator rating shows on its own scale', () => {
  render(<PersonCard
    person={{
      ...person,
      facilitatorFeedback: [
        {
          id: 'recFeedbackSample1', reviewer: 'Sample Facilitator', rating: 5, ratingOutOf: 5, nextSteps: [], recommendToFacilitate: false,
        },
        {
          id: 'recFeedbackSample2', reviewer: 'Other Facilitator', rating: 8, ratingOutOf: 10, nextSteps: [], recommendToFacilitate: false,
        },
      ],
    }}
    showName
  />);
  expect(screen.getAllByText('5/5').length).toBeGreaterThan(0);
  expect(screen.getAllByText('8/10').length).toBeGreaterThan(0);
  expect(screen.queryByText('5/10')).toBeNull();
});

test('a dropped-out course shows their reason when the row is opened, and a dash when they gave none', () => {
  render(<PersonCard
    person={{
      ...person,
      history: [{
        id: 'recScoutSample002', course: 'AGI Strategy', roundName: 'AGI Strategy (2026 May W20) - Part-time', roundStart: '2026-05-11', facilitated: false, hasCertificate: false, droppedOut: true, dropOutReason: 'Started a new job', isCurrent: false,
      }],
    }}
    showName
  />);
  expect(screen.queryByText('Started a new job')).toBeNull();
  fireEvent.click(screen.getByText('Dropped out'));
  expect(screen.getByText('Started a new job')).toBeTruthy();

  cleanup();
  render(<PersonCard
    person={{
      ...person,
      history: [{
        id: 'recScoutSample002', course: 'AGI Strategy', roundName: 'AGI Strategy (2026 May W20) - Part-time', roundStart: '2026-05-11', facilitated: false, hasCertificate: false, droppedOut: true, isCurrent: false,
      }],
    }}
    showName
  />);
  fireEvent.click(screen.getByText('Dropped out'));
  expect(screen.getByText('Drop out reason')).toBeTruthy();
  expect(screen.getByText('–')).toBeTruthy();
});

test('the must-look reason names the signals behind it and only shows for must-look people', () => {
  const strong: Person = {
    ...person,
    opinion: 'Strong yes',
    facilitatorFeedback: [{
      id: 'recPeerSample00001', rating: 10, ratingOutOf: 10, nextSteps: [], recommendToFacilitate: false,
    }],
    reports: [{
      id: 'recReportSample001', overallTake: 'Strong yes', facilitator: 'Sample Facilitator', nextSteps: [], ratings: [],
    }, {
      id: 'recReportSample002', overallTake: 'Weak yes', nextSteps: [], ratings: [],
    }],
  };
  expect(mustLookReasons(strong)).toEqual(['Endorsed by Sample Facilitator', 'Strong yes', 'Facilitator score 10/10']);
  expect(mustLookReasons(person)).toEqual([]);
  render(<PersonCard person={strong} showName mustLook />);
  expect(screen.getByText('Shortlisted because').parentElement!.textContent).toBe('Shortlisted because Endorsed by Sample Facilitator · Strong yes · Facilitator score 10/10');
  cleanup();
  render(<PersonCard person={strong} showName />);
  expect(screen.queryByText('Shortlisted because')).toBeNull();
});
