import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PiCode, PiRocketLaunch, PiScales } from 'react-icons/pi';
import PersonasSection from './PersonasSection';

const mockPersonas = [
  {
    icon: PiCode,
    title: 'Technical people considering governance',
    summary: 'You get the tech. Now you want to know if policy is where you should point it.',
    description: 'You understand the technology - how the systems work, what scaling means.',
    valueProposition: 'People like you have made this move.',
  },
  {
    icon: PiRocketLaunch,
    title: 'High-potential people early in their careers',
    summary: 'You have options. You\'re not the type to drift into a default path.',
    description: 'You\'re at a top university or recently graduated.',
    valueProposition: 'You\'ll join a cohort of others at the same stage.',
  },
  {
    icon: PiScales,
    title: 'Policy professionals adding AI expertise',
    summary: 'You know how policy works. AI is eating your field.',
    description: 'You already work in government, a think tank, or policy.',
    valueProposition: 'You\'ll become the person your org turns to on AI.',
  },
];

describe('PersonasSection', () => {
  it('renders correctly with default expanded index', () => {
    const { container } = render(<PersonasSection personas={mockPersonas} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} />);
    expect(getByText('Who this course is for')).toBeDefined();
  });

  it('renders custom title when provided', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} title="Custom Title" />);
    expect(getByText('Custom Title')).toBeDefined();
  });

  it('renders all persona titles', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} />);

    mockPersonas.forEach((persona) => {
      expect(getByText(persona.title)).toBeDefined();
    });
  });

  it('expands first persona by default', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} />);

    // First persona's content should be visible
    expect(getByText(mockPersonas[0]!.valueProposition)).toBeDefined();

    // Second persona's content should not be in the DOM or should be hidden
    const secondPersonaButton = getByText(mockPersonas[1]!.title).closest('button');
    expect(secondPersonaButton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('starts with all personas collapsed when defaultExpandedIndex is -1', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} defaultExpandedIndex={-1} />);

    // All buttons should have aria-expanded="false"
    mockPersonas.forEach((persona) => {
      const button = getByText(persona.title).closest('button');
      expect(button?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('expands specified persona when defaultExpandedIndex is set', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} defaultExpandedIndex={1} />);

    // Second persona should be expanded
    const secondPersonaButton = getByText(mockPersonas[1]!.title).closest('button');
    expect(secondPersonaButton?.getAttribute('aria-expanded')).toBe('true');

    // First persona should be collapsed
    const firstPersonaButton = getByText(mockPersonas[0]!.title).closest('button');
    expect(firstPersonaButton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles persona expansion when clicked', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} />);

    // First persona starts expanded
    const firstPersonaButton = getByText(mockPersonas[0]!.title).closest('button');
    expect(firstPersonaButton?.getAttribute('aria-expanded')).toBe('true');

    // Click to collapse
    fireEvent.click(firstPersonaButton!);
    expect(firstPersonaButton?.getAttribute('aria-expanded')).toBe('false');

    // Click to expand again
    fireEvent.click(firstPersonaButton!);
    expect(firstPersonaButton?.getAttribute('aria-expanded')).toBe('true');
  });

  it('collapses other personas when a new one is expanded', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} />);

    const firstPersonaButton = getByText(mockPersonas[0]!.title).closest('button');
    const secondPersonaButton = getByText(mockPersonas[1]!.title).closest('button');

    // First is expanded initially
    expect(firstPersonaButton?.getAttribute('aria-expanded')).toBe('true');
    expect(secondPersonaButton?.getAttribute('aria-expanded')).toBe('false');

    // Click second persona
    fireEvent.click(secondPersonaButton!);

    // Now second is expanded, first is collapsed
    expect(firstPersonaButton?.getAttribute('aria-expanded')).toBe('false');
    expect(secondPersonaButton?.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders CTA button when provided', () => {
    const cta = { text: 'Apply now', url: 'https://example.com/apply' };
    const { getByRole } = render(<PersonasSection personas={mockPersonas} cta={cta} />);

    const ctaButton = getByRole('link', { name: 'Apply now' });
    expect(ctaButton).toBeDefined();
    expect(ctaButton.getAttribute('href')).toBe('https://example.com/apply');
  });

  it('does not render CTA button when not provided', () => {
    const { queryByRole } = render(<PersonasSection personas={mockPersonas} />);
    expect(queryByRole('link', { name: 'Apply now' })).toBeNull();
  });

  it('renders persona summaries when provided', () => {
    const { getByText } = render(<PersonasSection personas={mockPersonas} />);

    // First persona is expanded, so summary should be visible
    expect(getByText(mockPersonas[0]!.summary)).toBeDefined();
  });
});
