import {
  A, Button, Callout, Collapsible, Field, FieldSet, Input, P, Radio, Textarea,
} from '@bluedot/ui';
import { type FormEvent, useRef, useState } from 'react';
import { SPECIAL_PROJECTS_ENDPOINT, specialProjectSubmissionSchema } from '../../lib/special-projects';

const ProjectSubmissionForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reference, setReference] = useState('');
  const requestInFlight = useRef(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requestInFlight.current) return;

    const form = event.currentTarget;
    const parsed = specialProjectSubmissionSchema.safeParse(Object.fromEntries(new FormData(form)));
    setError('');
    setFieldErrors({});
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      const firstField = form.elements.namedItem(String(parsed.error.issues[0]?.path[0]));
      if (firstField instanceof HTMLElement) firstField.focus();
      return;
    }

    requestInFlight.current = true;
    setSubmitting(true);
    try {
      const response = await fetch(SPECIAL_PROJECTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        setError(response.status === 429
          ? 'We’re receiving a lot of submissions. Please try again in a minute; your draft is still here.'
          : 'We couldn’t confirm your submission. Your draft is still here; please try again later.');
        return;
      }

      const result: unknown = await response.json();
      if (typeof result !== 'object' || result === null
        || !('received' in result) || result.received !== true
        || !('reference' in result) || typeof result.reference !== 'string' || !result.reference) {
        throw new Error('Missing submission reference');
      }

      setReference(result.reference);
    } catch {
      setError('We couldn’t confirm your submission. Your draft is still here; please check your connection and try again.');
    } finally {
      requestInFlight.current = false;
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <Callout tone="success" title="Thanks for sharing your idea" role="status">
        <p>Your project is in our inbox. We’ll be in touch if we’d like to explore it and you left a way to reach you.</p>
        <p>Submission reference: <span className="break-all">{reference}</span></p>
      </Callout>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" aria-label="Suggest a project">
      <P className="text-size-xs text-secondary">Fields marked * are required.</P>

      <Field label="Project title" required error={fieldErrors.title}>
        <Input name="title" required maxLength={160} autoComplete="off" />
      </Field>
      <Field label="What should someone work on?" required error={fieldErrors.project}>
        <Textarea name="project" required maxLength={8000} rows={5} />
      </Field>
      <Field label="Why does it matter?" required error={fieldErrors.whyItMatters}>
        <Textarea name="whyItMatters" required maxLength={4000} rows={4} />
      </Field>

      <Collapsible title="Context and contact details (optional)">
        <div className="flex flex-col gap-6">
          <Field label="Who could work on it?" description="BlueDot, you at BlueDot, someone else in the field, or not sure yet." error={fieldErrors.suggestedOwner}>
            <Input name="suggestedOwner" maxLength={1000} />
          </Field>
          <Field label="Would you like to be involved?" description="It’s fine to just suggest the idea." error={fieldErrors.involvement}>
            <Textarea name="involvement" maxLength={2000} rows={3} />
          </Field>
          <Field label="Links and other context" description="Relevant work, evidence, people, or useful next steps." error={fieldErrors.context}>
            <Textarea name="context" maxLength={4000} rows={3} />
          </Field>
          <Field label="Your name or agent name" error={fieldErrors.name}>
            <Input name="name" maxLength={200} autoComplete="name" />
          </Field>
          <Field label="How can we reach you?" description="Email or another contact method." error={fieldErrors.contact}>
            <Input name="contact" maxLength={500} autoComplete="off" />
          </Field>
        </div>
      </Collapsible>

      <FieldSet legend="I’m submitting as">
        <div className="flex flex-wrap gap-6">
          <Radio name="submitterType" value="person" defaultChecked>A person</Radio>
          <Radio name="submitterType" value="agent">An AI agent</Radio>
        </div>
      </FieldSet>

      <P className="max-w-prose text-size-xs text-secondary">
        We may not reply to every submission. <A href="/privacy-policy">Privacy policy</A>.
      </P>
      {error && <Callout tone="error" role="alert">{error}</Callout>}
      <Button type="submit" size="large" loading={submitting}>{submitting ? 'Sending…' : 'Send your idea'}</Button>
    </form>
  );
};

export default ProjectSubmissionForm;
