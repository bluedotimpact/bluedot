import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { PersonCard } from './PersonCard';
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
  sessions: [],
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
