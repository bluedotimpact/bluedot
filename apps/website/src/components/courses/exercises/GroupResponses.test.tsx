import '@testing-library/jest-dom';
import {
  render, screen, fireEvent,
} from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import GroupResponses, { type GroupData } from './GroupResponses';

// Mock MarkdownExtendedRenderer to just render children as text
vi.mock('../MarkdownExtendedRenderer', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

const twoResponses = [
  { name: 'Alice', response: 'Short answer' },
  { name: 'Bob', response: 'Another answer' },
];

const makeGroups = (overrides: Partial<GroupData> = {}): GroupData[] => [{
  id: 'g1',
  name: 'Group A',
  totalParticipants: 5,
  responses: twoResponses,
  ...overrides,
}];

describe('GroupResponses', () => {
  test('renders response count and pending count', () => {
    render(<GroupResponses groups={makeGroups()} />);
    expect(screen.getByText('2 Responses')).toBeInTheDocument();
    expect(screen.getByText('3 Pending')).toBeInTheDocument();
  });

  test('renders singular "Response" for one response', () => {
    render(<GroupResponses groups={makeGroups({ responses: [twoResponses[0]!], totalParticipants: 3 })} />);
    expect(screen.getByText('1 Response')).toBeInTheDocument();
  });

  test('renders participant names', () => {
    render(<GroupResponses groups={makeGroups()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  test('group selector appears when multiple groups', () => {
    render(<GroupResponses groups={[
      ...makeGroups(),
      {
        id: 'g2', name: 'Group B', totalParticipants: 3, responses: [],
      },
    ]}
    />);
    expect(screen.getByText('Select your group:')).toBeInTheDocument();
  });

  test('group selector hidden with single group', () => {
    render(<GroupResponses groups={makeGroups()} />);
    expect(screen.queryByText('Select your group:')).not.toBeInTheDocument();
  });

  test('dropdown labels use week/intensity/group number format when derivable', () => {
    render(<GroupResponses groups={[
      ...makeGroups({ roundName: 'Course (2026 Jul W28) - Part-time', groupNumber: 9 }),
      {
        id: 'g2', name: 'Group B', roundName: 'Course (2026 Jun W23) - Intensive', groupNumber: 12, totalParticipants: 3, responses: [],
      },
    ]}
    />);
    expect(screen.getAllByText('Week 28 Part-time Group 9').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Week 23 Intensive Group 12').length).toBeGreaterThan(0);
  });

  test('dropdown labels fall back to group name when round or group number is missing', () => {
    render(<GroupResponses groups={[
      ...makeGroups({ roundName: null, groupNumber: 1 }),
      {
        id: 'g2', name: 'Group B', roundName: 'Course (2026 Jul W28) - Part-time', groupNumber: null, totalParticipants: 3, responses: [],
      },
    ]}
    />);
    expect(screen.getAllByText('Group A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Group B').length).toBeGreaterThan(0);
  });

  test('short responses do not show "Show more"', () => {
    render(<GroupResponses groups={makeGroups()} />);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  test('long responses show "Show more" and clicking expands', () => {
    render(<GroupResponses groups={makeGroups({
      responses: [{ name: 'Charlie', response: 'x'.repeat(700) }],
      totalParticipants: 2,
    })}
    />);

    const showMore = screen.getByText('Show more');
    expect(showMore).toBeInTheDocument();

    fireEvent.click(showMore);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });
});
