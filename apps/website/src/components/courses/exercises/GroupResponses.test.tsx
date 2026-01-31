import {
  render, screen, fireEvent,
} from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import GroupResponses from './GroupResponses';

// Mock MarkdownExtendedRenderer to just render children as text
vi.mock('../MarkdownExtendedRenderer', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

const twoResponses = [
  { name: 'Alice', response: 'Short answer' },
  { name: 'Bob', response: 'Another answer' },
];

describe('GroupResponses', () => {
  test('renders response count and pending count', () => {
    render(<GroupResponses responses={twoResponses} totalParticipants={5} />);
    expect(screen.getByText('2 Responses')).toBeTruthy();
    expect(screen.getByText('3 Pending')).toBeTruthy();
  });

  test('renders singular "Response" for one response', () => {
    render(<GroupResponses responses={[twoResponses[0]!]} totalParticipants={3} />);
    expect(screen.getByText('1 Response')).toBeTruthy();
  });

  test('renders participant names', () => {
    render(<GroupResponses responses={twoResponses} totalParticipants={4} />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  test('group selector appears when multiple groups', () => {
    const groups = [
      { id: 'g1', name: 'Group A' },
      { id: 'g2', name: 'Group B' },
    ];
    const onGroupChange = vi.fn();

    render(
      <GroupResponses
        responses={twoResponses}
        totalParticipants={4}
        groups={groups}
        selectedGroupId="g1"
        onGroupChange={onGroupChange}
      />,
    );

    expect(screen.getByText('Select your group:')).toBeTruthy();
    expect(screen.getByLabelText('Select your group')).toBeTruthy();
  });

  test('group selector hidden with single group', () => {
    render(
      <GroupResponses
        responses={twoResponses}
        totalParticipants={4}
        groups={[{ id: 'g1', name: 'Group A' }]}
        selectedGroupId="g1"
      />,
    );

    expect(screen.queryByText('Select your group:')).toBeFalsy();
  });

  test('short responses do not show "Show more"', () => {
    render(<GroupResponses responses={twoResponses} totalParticipants={4} />);
    expect(screen.queryByText('Show more')).toBeFalsy();
  });

  test('long responses show "Show more" and clicking expands', () => {
    const longResponse = { name: 'Charlie', response: 'x'.repeat(700) };
    render(<GroupResponses responses={[longResponse]} totalParticipants={2} />);

    const showMore = screen.getByText('Show more');
    expect(showMore).toBeTruthy();

    fireEvent.click(showMore);
    expect(screen.queryByText('Show more')).toBeFalsy();
  });
});
