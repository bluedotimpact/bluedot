import {
  describe, expect, test, vi,
} from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { Radio } from './Radio';

const renderGroup = (props: { disabled?: boolean } = {}) => render(<fieldset>
  <legend>Frequency</legend>
  <Radio name="frequency" value="daily" {...props}>Daily</Radio>
  <Radio name="frequency" value="weekly" {...props}>Weekly</Radio>
  <Radio name="frequency" value="never" {...props}>Never</Radio>
</fieldset>);

describe('Radio', () => {
  test('renders Default as expected', () => {
    const { container } = render(<Radio name="frequency" value="weekly">Weekly digest</Radio>);
    expect(container).toMatchSnapshot();
  });

  test('renders Card with tone as expected', () => {
    const { container } = render(<Radio card tone="success" name="answer" value="a" defaultChecked disabled>Correct answer</Radio>);
    expect(container).toMatchSnapshot();
  });

  test('clicking the label selects it and reports the change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Radio name="frequency" value="weekly" onChange={onChange}>Weekly</Radio>);

    await user.click(screen.getByText('Weekly'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
  });

  test('forwards ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio ref={ref} name="frequency" value="weekly">Weekly</Radio>);

    expect(ref.current).toBe(screen.getByRole('radio'));
  });

  test('only one option in a group can be selected', async () => {
    const user = userEvent.setup();
    renderGroup();

    await user.click(screen.getByRole('radio', { name: 'Daily' }));
    await user.click(screen.getByRole('radio', { name: 'Never' }));

    expect(screen.getByRole('radio', { name: 'Daily' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Never' })).toBeChecked();
  });

  test('arrow keys move selection within the group', async () => {
    const user = userEvent.setup();
    renderGroup();

    await user.click(screen.getByRole('radio', { name: 'Daily' }));
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('radio', { name: 'Weekly' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
  });

  test('disabled ignores clicks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Radio name="frequency" value="weekly" disabled onChange={onChange}>Weekly</Radio>);

    const radio = screen.getByRole('radio');
    await user.click(radio);

    expect(radio).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('submits the selected value through FormData', async () => {
    const user = userEvent.setup();
    let data: FormData | undefined;
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      data = new FormData(e.currentTarget);
    };

    render(<form onSubmit={handleSubmit}>
      <Radio name="frequency" value="daily">Daily</Radio>
      <Radio name="frequency" value="weekly" defaultChecked>Weekly</Radio>
      <button type="submit">Save</button>
    </form>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(data?.get('frequency')).toBe('weekly');
  });

  test('aria-invalid reaches the input', () => {
    render(<Radio name="frequency" value="weekly" aria-invalid>Weekly</Radio>);

    expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'true');
  });

  test('tone does not disable the input', () => {
    render(<Radio name="answer" value="a" tone="error">Wrong</Radio>);

    expect(screen.getByRole('radio')).toBeEnabled();
  });
});
