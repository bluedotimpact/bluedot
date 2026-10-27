import {
  cleanup, fireEvent, render, screen,
} from '@testing-library/react';
import { useState } from 'react';
import {
  afterEach, expect, test, vi,
} from 'vitest';
import { PersonSearch } from './PersonSearch';
import type { QueueItem } from './types';

afterEach(cleanup);

const items: QueueItem[] = [
  {
    id: 'rec1', name: 'Jordan Patel', email: 'jordan@example.org', course: 'Biosecurity', roundName: 'Biosecurity (2026 Aug W32)', hasCertificate: true, hasReport: true, mustLook: false,
  },
];

const Harness = ({ onSelect }: { onSelect: (item: QueueItem) => void }) => {
  const [query, setQuery] = useState('');
  return <PersonSearch items={items} query={query} onQueryChange={setQuery} onSelect={onSelect} />;
};

test('typing and clearing keep focus in the box', () => {
  render(<Harness onSelect={vi.fn()} />);
  const box = screen.getByLabelText('Find a participant in the queue');
  box.focus();
  expect(screen.getByLabelText('Clear search').hidden).toBe(true);

  fireEvent.change(box, { target: { value: 'j' } });
  expect(document.activeElement).toBe(box);
  expect(screen.getByLabelText('Find a participant in the queue')).toBe(box);

  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(box.getAttribute('value')).toBe('');
  expect(document.activeElement).toBe(box);
  expect(screen.getByLabelText('Clear search').hidden).toBe(true);
});
