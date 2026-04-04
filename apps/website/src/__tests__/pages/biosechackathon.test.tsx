import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import BiosecHackathonPage from '../../pages/biosechackathon';
import EventsHackathonAliasPage from '../../pages/events/hackathon';
import SpecialEventAliasPage from '../../pages/events/special-event';

describe('BiosecHackathonPage', () => {
  test('renders the page hierarchy and signup options', () => {
    const { container } = render(<BiosecHackathonPage />);

    expect(screen.getByRole('heading', { name: 'BIOSECURITY HACKATHON' })).toBeInTheDocument();
    expect(screen.getByText('24-26 April 2026')).toBeInTheDocument();

    const onlineCta = screen.getByRole('link', { name: 'Sign up to participate online' });
    const onlineUrl = new URL(onlineCta.getAttribute('href') ?? '');

    expect(`${onlineUrl.origin}${onlineUrl.pathname}`).toBe('https://apartresearch.com/sprints/aixbio-hackathon-2026-04-24-to-2026-04-26');
    expect(onlineUrl.searchParams.get('utm_source')).toBe('bluedot');
    expect(onlineUrl.searchParams.get('utm_medium')).toBe('event_page');
    expect(onlineUrl.searchParams.get('utm_campaign')).toBe('biosecurity_hackathon_2026');
    expect(onlineUrl.searchParams.get('utm_content')).toBe('online');
    expect(onlineCta).toHaveAttribute('target', '_blank');
    expect(onlineCta).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(onlineCta).toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    expect(screen.getByRole('button', { name: '[tbc] Boston' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '[tbc] SF' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '[tbc] London' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '[tbc] Cambridge' })).toBeDisabled();

    const apartLink = screen.getByRole('link', { name: 'Apart Research' });
    const cambioLink = screen.getByRole('link', { name: 'Cambridge Biosecurity Hub' });

    expect(apartLink).toHaveAttribute('href', 'https://apartresearch.com/');
    expect(apartLink).toHaveAttribute('target', '_blank');
    expect(apartLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(cambioLink).toHaveAttribute('href', 'https://www.cambiohub.org/');
    expect(cambioLink).toHaveAttribute('target', '_blank');
    expect(cambioLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));

    expect(container).toMatchSnapshot();
  });

  test('keeps legacy aliases pointed at the biosecurity hackathon page', () => {
    expect(EventsHackathonAliasPage).toBe(BiosecHackathonPage);
    expect(SpecialEventAliasPage).toBe(BiosecHackathonPage);
  });
});
