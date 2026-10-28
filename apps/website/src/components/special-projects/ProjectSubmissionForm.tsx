import {
  A, Button, Callout, Collapsible, Field, Input, P, Textarea,
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

      <Field label="What outcome would you like to see in the world?" required error={fieldErrors.outcome}>
        <Textarea name="outcome" required maxLength={8000} rows={5} />
      </Field>
      <Field label="Why?" required error={fieldErrors.whyItMatters}>
        <Textarea name="whyItMatters" required maxLength={4000} rows={4} />
      </Field>
      <Field label="How could someone make it happen/make progress towards it?" required error={fieldErrors.approach}>
        <Textarea name="approach" required maxLength={8000} rows={5} />
      </Field>

      <Collapsible title="Personal details (optional)">
        <div className="flex flex-col gap-6">
          <Field label="Would you like to be involved?" error={fieldErrors.involvement}>
            <Input name="involvement" maxLength={2000} />
          </Field>
          <Field label="Your name" error={fieldErrors.name}>
            <Input name="name" maxLength={200} autoComplete="name" />
          </Field>
          <Field label="How can we reach you?" description="Email or another contact method." error={fieldErrors.contact}>
            <Input name="contact" maxLength={500} autoComplete="off" />
          </Field>
        </div>
      </Collapsible>

      <P className="max-w-prose text-size-xs text-secondary">
        We may not reply to every submission. <A href="/privacy-policy">Privacy policy</A>.
      </P>
      {error && <Callout tone="error" role="alert">{error}</Callout>}
      <Button type="submit" size="large" loading={submitting}>{submitting ? 'Sending…' : 'Send your idea'}</Button>
    </form>
  );
};

export default ProjectSubmissionForm;
