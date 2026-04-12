import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import GrantProgramHero from './GrantProgramHero';

describe('GrantProgramHero', () => {
  test('forwards CTA click handlers', () => {
    const onPrimaryClick = vi.fn();
    const onSecondaryClick = vi.fn();

    render(<GrantProgramHero
      slug="rapid-grants"
      title="Rapid Grants"
      description="Test description"
      status="Active"
      primaryCta={{ text: 'Apply now', url: '/apply', onClick: onPrimaryClick }}
      secondaryCta={{ text: 'View programs', url: '/programs', onClick: onSecondaryClick }}
      facts={[{ label: 'Typical grants', value: 'Up to $5k' }]}
    />);

    fireEvent.click(screen.getByRole('link', { name: 'Apply now' }));
    fireEvent.click(screen.getByRole('link', { name: 'View programs' }));

    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(onSecondaryClick).toHaveBeenCalledTimes(1);
  });
});
