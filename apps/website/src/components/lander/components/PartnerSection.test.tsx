import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PartnerSection from './PartnerSection';

const mockProps = {
  title: 'Co-created with our network of leading AI industry partners',
  partners: [
    {
      name: 'Entrepreneur First',
      url: 'https://www.joinef.com/',
      logo: '/images/agi-strategy/ef.svg',
      descriptionShort: 'We collaborate with EF to host AI safety hackathons.',
      descriptionFull: 'A London-based startup incubation programme. We collaborate with EF to host AI safety hackathons.',
    },
    {
      name: 'Institute for Progress',
      url: 'https://ifp.org/',
      logo: '/images/agi-strategy/ifp.svg',
      descriptionShort: 'We collaborate with IFP to get impactful projects off the ground.',
      descriptionFull: 'IFP is a science and innovation think tank. We collaborate with IFP to get impactful projects off the ground.',
    },
    {
      name: '50 Years',
      url: 'https://www.fiftyyears.com/',
      logo: '/images/agi-strategy/fifty-years.svg',
      descriptionShort: 'We fast-track entrepreneurs into their 5050 AI cohorts.',
      descriptionFull: 'A pre-seed and seed VC firm. We fast-track our most promising entrepreneurs into their 5050 AI cohorts.',
    },
  ],
};

describe('PartnerSection', () => {
  it('renders correctly', () => {
    const { container } = render(<PartnerSection {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the section title', () => {
    const { getByText } = render(<PartnerSection {...mockProps} />);
    expect(getByText('Co-created with our network of leading AI industry partners')).toBeDefined();
  });

  it('renders partner logos with links', () => {
    const { getAllByRole } = render(<PartnerSection {...mockProps} />);
    const links = getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
