import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import ContractorPrivacyNoticePage from '../../pages/privacy';
import { SECTIONS } from '../../components/contractor-privacy-notice/content';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../testUtils';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/privacy',
  pathname: '/privacy',
  push: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
    trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
  );
});

describe('ContractorPrivacyNoticePage', () => {
  test('renders the hero, summary cards and every section heading', () => {
    render(<ContractorPrivacyNoticePage />, { wrapper: TrpcProvider });

    expect(screen.getByRole('heading', { name: 'Contractor Privacy Notice', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your privacy at a glance', level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).filter((h) => h.closest('ul'))).toHaveLength(6);
    SECTIONS.forEach((section) => {
      expect(screen.getByRole('heading', { name: section.title, level: 2 })).toHaveAttribute('id', section.id);
    });
  });

  test('every in-page link points at a heading on the page', () => {
    const { container } = render(<ContractorPrivacyNoticePage />, { wrapper: TrpcProvider });

    const anchorLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    expect(anchorLinks.length).toBeGreaterThan(15);
    anchorLinks.forEach((link) => {
      const target = document.getElementById(link.getAttribute('href')!.slice(1));
      expect(target?.tagName, link.getAttribute('href')!).toBe('H2');
    });
  });

  test('"Read more" layers start collapsed', () => {
    const { container } = render(<ContractorPrivacyNoticePage />, { wrapper: TrpcProvider });

    const details = Array.from(container.querySelectorAll('details'));
    expect(details).toHaveLength(SECTIONS.filter((section) => section.readMore).length);
    details.forEach((d) => expect(d).not.toHaveAttribute('open'));
  });

  test('table rows are labelled by a row header', () => {
    render(<ContractorPrivacyNoticePage />, { wrapper: TrpcProvider });

    expect(screen.getByRole('rowheader', { name: 'You set up payment or submit an invoice' })).toBeInTheDocument();
  });

  test('keeps the Juro credit required by its licence', () => {
    render(<ContractorPrivacyNoticePage />, { wrapper: TrpcProvider });

    expect(screen.getByRole('link', { name: 'Juro' })).toHaveAttribute('href', 'https://juro.com');
    expect(screen.getByRole('link', { name: 'free privacy policy template' })).toHaveAttribute('href', 'https://info.juro.com/privacy-policy-template');
  });
});
