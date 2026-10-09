import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { PersonCard } from './PersonCard';
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

test('the AI summary sits at the top of the card with the AI mark, and is absent when there is none', () => {
  render(<PersonCard person={{ ...person, aiSummary: 'Built a thing last month.' }} showName />);
  const summary = screen.getByText('Built a thing last month.');
  expect(summary.textContent).toBe('AIBuilt a thing last month.');
  cleanup();
  render(<PersonCard person={person} showName />);
  expect(screen.queryByText('Built a thing last month.')).toBeNull();
});
