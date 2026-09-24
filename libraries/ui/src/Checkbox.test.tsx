import {
  describe, expect, test, vi,
} from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  test('renders Default as expected', () => {
    const { container } = render(<Checkbox>Email me course updates</Checkbox>);
    expect(container).toMatchSnapshot();
  });

  test('renders Card as expected', () => {
    const { container } = render(<Checkbox card defaultChecked>Email me course updates</Checkbox>);
    expect(container).toMatchSnapshot();
  });

  test('clicking the box toggles and reports the new value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Email me</Checkbox>);

    await user.click(screen.getByRole('checkbox', { name: 'Email me' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].target.checked).toBe(true);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('forwards ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>Email me</Checkbox>);

    expect(ref.current).toBe(screen.getByRole('checkbox'));
  });

  test('clicking the label text toggles', async () => {
    const user = userEvent.setup();
    render(<Checkbox>Email me</Checkbox>);

    await user.click(screen.getByText('Email me'));

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('Space toggles when focused', async () => {
    const user = userEvent.setup();
    render(<Checkbox>Email me</Checkbox>);

    await user.tab();
    expect(screen.getByRole('checkbox')).toHaveFocus();
    await user.keyboard(' ');

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('disabled ignores clicks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox disabled onChange={onChange}>Email me</Checkbox>);

    const box = screen.getByRole('checkbox');
    await user.click(box);

    expect(box).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('indeterminate sets the native mixed state', () => {
    render(<Checkbox indeterminate>Select all</Checkbox>);

    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(true);
  });

  test('submits name and value through FormData', async () => {
    const user = userEvent.setup();
    let data: FormData | undefined;
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      data = new FormData(e.currentTarget);
    };

    render(<form onSubmit={handleSubmit}>
      <Checkbox name="topics" value="alignment" defaultChecked>Alignment</Checkbox>
      <Checkbox name="topics" value="governance">Governance</Checkbox>
      <button type="submit">Save</button>
    </form>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(data?.getAll('topics')).toEqual(['alignment']);
  });

  test('aria-invalid reaches the input', () => {
    render(<Checkbox aria-invalid>I agree</Checkbox>);

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
