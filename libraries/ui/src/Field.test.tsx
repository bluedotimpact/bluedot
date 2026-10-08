import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Field, FieldSet } from './Field';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Checkbox } from './Checkbox';
import { Radio } from './Radio';
import { Select } from './Select';

describe('Field', () => {
  test('labels the control and describes it with description and error', () => {
    render(<Field label="Email" description="Cohort logistics only." error="Enter a valid email." required>
      <Input type="email" />
    </Field>);

    // `*` is aria-hidden, so it is not part of the accessible name
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(screen.getByText('Email').textContent).toBe('Email *');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Cohort logistics only. Enter a valid email.');
    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument();
  });

  test('omits aria-describedby, aria-invalid and the error node when nothing is set', () => {
    const { container } = render(<Field label="Name">
      <Input />
    </Field>);

    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toBeRequired();
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  test('explicit control props win, aria-describedby keeps both', () => {
    render(<>
      <p id="external-hint">External hint</p>
      <Field label="Name" description="Hint" error="Bad" required>
        <Input aria-describedby="external-hint" aria-invalid={false} required={false} />
      </Field>
    </>);

    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toBeRequired();
    expect(input).toHaveAccessibleDescription('External hint Hint Bad');
  });

  test('uses an explicit id for both label and control', () => {
    render(<Field id="profile-url" label="Profile URL">
      <Input />
    </Field>);

    expect(screen.getByRole('textbox', { name: 'Profile URL' })).toHaveAttribute('id', 'profile-url');
    expect(screen.getByText('Profile URL')).toHaveAttribute('for', 'profile-url');
  });

  test('wires a Textarea', () => {
    render(<Field label="Notes" error="Required">
      <Textarea />
    </Field>);

    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Required');
  });

  test('wires a Select trigger', () => {
    render(<Field label="Timezone" description="Your local offset." error="Pick one">
      <Select options={[{ value: 'utc', label: 'UTC' }]} />
    </Field>);

    const trigger = screen.getByRole('button', { name: /Timezone/ });
    expect(trigger).toHaveAccessibleDescription('Your local offset. Pick one');
    expect(screen.getByText('Timezone')).toHaveAttribute('for', trigger.id);
  });

  test('without a label, a Checkbox keeps its own label and still gets the error', () => {
    render(<Field error="You must agree to continue.">
      <Checkbox>I agree</Checkbox>
    </Field>);

    const checkbox = screen.getByRole('checkbox', { name: 'I agree' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAccessibleDescription('You must agree to continue.');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('controls outside a Field are untouched', () => {
    render(<Input aria-label="Search" />);

    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input).not.toHaveAttribute('id');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-labelledby');
  });

  test('renders Default as expected', () => {
    const { container } = render(<Field id="email" label="Email" description="Cohort logistics only." error="Enter a valid email." required>
      <Input type="email" />
    </Field>);

    expect(container).toMatchSnapshot();
  });
});

describe('FieldSet', () => {
  test('names the group with the legend and describes group and options', () => {
    render(<FieldSet legend="Topics" description="Pick all that apply." error="Pick at least one." required>
      <Checkbox name="topics" value="a">Alignment</Checkbox>
      <Checkbox name="topics" value="b">Governance</Checkbox>
    </FieldSet>);

    const group = screen.getByRole('group', { name: 'Topics' });
    expect(group).toHaveAccessibleDescription('Pick all that apply. Pick at least one.');

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(2);
    for (const box of boxes) {
      expect(box).toHaveAttribute('aria-invalid', 'true');
      expect(box).toHaveAccessibleDescription('Pick all that apply. Pick at least one.');
      expect(box).not.toBeRequired();
      expect(box).not.toHaveAttribute('aria-labelledby');
      expect(box).not.toHaveAttribute('id');
    }
  });

  test('options keep their own labels and ids', () => {
    render(<FieldSet legend="Course">
      <Radio name="course" value="a" id="course-a">AI Safety</Radio>
      <Radio name="course" value="b">Governance</Radio>
    </FieldSet>);

    expect(screen.getByRole('radio', { name: 'AI Safety' })).toHaveAttribute('id', 'course-a');
    expect(screen.getByRole('radio', { name: 'Governance' })).not.toHaveAttribute('id');
    expect(screen.getByRole('group')).not.toHaveAttribute('aria-describedby');
  });

  test('renders Default as expected', () => {
    const { container } = render(<FieldSet legend="Topics" description="Pick all that apply." error="Pick at least one." required>
      <Checkbox name="topics" value="a">Alignment</Checkbox>
    </FieldSet>);

    expect(container).toMatchSnapshot();
  });
});
