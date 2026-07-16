import {
  CTALinkOrButton,
  ErrorSection,
  Input,
  Eyebrow,
  ProgressDots,
  Select,
  Textarea,
  TimeAvailabilityGrid,
  toast,
} from '@bluedot/ui';
import {
  formatOffsetFromMinutesToString,
  gridToUtcIntervalString,
  offsets,
  type TimeAvailabilityMap,
  utcIntervalStringToGrid,
} from '@bluedot/utils';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ROUTES } from '../../../lib/routes';
import { formatDateRange } from '../../../lib/utils';
import type { QuickApplyPrefillData } from '../../../server/routers/facilitator-applications';
import { trpc } from '../../../utils/trpc';

const CURRENT_ROUTE = ROUTES.quickApply;

type QuestionField =
  | 'prevEngagement'
  | 'skills'
  | 'impressiveProject'
  | 'motivationToFacilitate'
  | 'prevFacilitationExperience';

type Question = {
  name: QuestionField;
  label: string;
  intro: string;
  bullets?: string[];
  outro?: string;
};

const QUESTIONS: Question[] = [
  {
    name: 'prevEngagement',
    label: '1. How have you engaged with the AI safety field so far?',
    intro: 'Show us you’re not starting from zero. This could include things like:',
    bullets: [
      'Projects you’ve worked on',
      'Blog posts you’ve written',
      'Resources you’ve read or watched',
      'Events you’ve organised or attended',
    ],
  },
  {
    name: 'skills',
    label: '2. What skills have you developed that could be used to make AI go well?',
    intro: 'We’re assembling a special forces team for AI safety. What will you contribute? This could be:',
    bullets: [
      'Policy or governance experience',
      'Technical/programming background',
      'Research or analytical skills',
      'Communications or organizing experience',
    ],
    outro: 'Technical and non-technical skills both matter. The fight to make AI go well needs every angle covered.',
  },
  {
    name: 'impressiveProject',
    label: '3. Tell us about one achievement you’re most proud of.',
    intro: 'We’re looking for builders, not just thinkers. Show us you ship:',
    bullets: [
      'That one project you pulled off',
      'The system you changed from the inside',
      'The community you built from scratch',
      'The challenge everyone said couldn’t be solved - and then you solved it',
    ],
    outro: 'This is your chance to brag. Use it!',
  },
  {
    name: 'motivationToFacilitate',
    label: '4. Why do you want to facilitate this course?',
    intro: 'We’d be interested to learn:',
    bullets: [
      'Why you want to teach others about this course',
      'Whether there are things you’re excited to get out of the course yourself',
    ],
  },
  {
    name: 'prevFacilitationExperience',
    label: '5. What’s your previous facilitation or teaching experience?',
    intro:
      'Include any experience you have with facilitating active learning. We expect some great facilitators won’t have prior experience - this isn’t a blocker, as we may provide training for you.',
  },
];

type FormValues = {
  numGroupsToFacilitate: number;
  formFeedback: string;
  prevEngagement: string;
  skills: string;
  impressiveProject: string;
  motivationToFacilitate: string;
  prevFacilitationExperience: string;
  timezone: string;
  timeAv: TimeAvailabilityMap;
  availabilityComments: string;
};

const emptyToUndefined = (value: string): string | undefined => (value.trim() ? value : undefined);

const formatRoundLine = (round: QuickApplyPrefillData['round']): string => {
  const name = [round.courseTitle, round.label].filter(Boolean).join(' - ');
  const dateRange = formatDateRange(round.firstDiscussionDate, round.lastDiscussionDate);
  if (name && dateRange) return `${name} (${dateRange})`;
  if (name) return name;
  return dateRange ?? '';
};

const QuickApplyHeader = ({ subtitle }: { subtitle?: string }) => (
  <header className="border-charcoal-light flex items-center gap-4 border-b bg-white px-5 py-5 sm:pr-5 sm:pl-10">
    <Link href="/" className="shrink-0">
      <img src="/images/logo/BlueDot_Impact_Logo.svg" alt="BlueDot Impact" className="h-5" />
    </Link>
    <div className="bg-charcoal-light h-[18px] w-px shrink-0" aria-hidden />
    <div className="text-size-xs flex min-w-0 items-center gap-2">
      <span className="text-bluedot-navy shrink-0 font-semibold">Quick Apply</span>
      {subtitle && (
        <>
          <span className="text-charcoal-mid shrink-0" aria-hidden>
            &middot;
          </span>
          <span className="text-bluedot-navy/60 truncate font-medium">{subtitle}</span>
        </>
      )}
    </div>
  </header>
);

const Shell = ({ subtitle, children }: { subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-cream-normal min-h-screen">
    <Head>
      <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
    </Head>
    <QuickApplyHeader subtitle={subtitle} />
    <div className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 py-8 pb-16">{children}</div>
  </div>
);

const Section = ({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="border-charcoal-light flex flex-col gap-7 rounded-lg border bg-white p-6 sm:p-9">
    <div className="flex flex-col gap-4">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-size-md text-bluedot-navy font-bold">{title}</h2>
        {description && <p className="text-size-xs text-bluedot-navy/60">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const QuestionCollapsible = ({
  title,
  intro,
  bullets,
  outro,
  children,
}: {
  title: string;
  intro: string;
  bullets?: string[];
  outro?: string;
  children: React.ReactNode;
}) => (
  <details className="group border-charcoal-light rounded-md border bg-white [&_summary::-webkit-details-marker]:hidden">
    <summary className="text-size-xs text-bluedot-navy flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-4 font-semibold">
      {title}
      <svg
        aria-hidden
        className="size-5 shrink-0 transition-transform group-open:rotate-180"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </summary>
    <div className="flex flex-col gap-3 px-3 pb-4">
      <div className="text-size-xxs text-bluedot-navy/60 flex flex-col gap-1">
        <p>{intro}</p>
        {bullets && (
          <ul className="list-disc space-y-0.5 pl-[18px]">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        )}
        {outro && <p>{outro}</p>}
      </div>
      {children}
    </div>
  </details>
);

const QuickApplyForm = ({ roundId, round, prefill }: { roundId: string } & QuickApplyPrefillData) => {
  const router = useRouter();
  const defaultTimezone = emptyToUndefined(prefill?.availabilityTimezone ?? '')
    ?? formatOffsetFromMinutesToString(new Date().getTimezoneOffset());

  let defaultTimeAv: TimeAvailabilityMap = {};
  if (prefill?.availabilityIntervalsUTC) {
    try {
      defaultTimeAv = utcIntervalStringToGrid(prefill.availabilityIntervalsUTC, defaultTimezone);
    } catch {
      // keep the empty map if stored intervals can't be parsed
    }
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      numGroupsToFacilitate: prefill?.numGroupsToFacilitate ?? 1,
      formFeedback: prefill?.formFeedback ?? '',
      prevEngagement: prefill?.prevEngagement ?? '',
      skills: prefill?.skills ?? '',
      impressiveProject: prefill?.impressiveProject ?? '',
      motivationToFacilitate: prefill?.motivationToFacilitate ?? '',
      prevFacilitationExperience: prefill?.prevFacilitationExperience ?? '',
      availabilityComments: prefill?.availabilityComments ?? '',
      timezone: defaultTimezone,
      timeAv: defaultTimeAv,
    },
  });

  const quickApply = trpc.facilitatorApplications.quickApply.useMutation();

  const onSubmit = (values: FormValues) => {
    quickApply.mutate(
      {
        roundId,
        numGroupsToFacilitate: values.numGroupsToFacilitate,
        formFeedback: emptyToUndefined(values.formFeedback),
        prevEngagement: emptyToUndefined(values.prevEngagement),
        skills: emptyToUndefined(values.skills),
        impressiveProject: emptyToUndefined(values.impressiveProject),
        motivationToFacilitate: emptyToUndefined(values.motivationToFacilitate),
        prevFacilitationExperience: emptyToUndefined(values.prevFacilitationExperience),
        availabilityIntervalsUTC: gridToUtcIntervalString(values.timeAv, values.timezone),
        availabilityTimezone: values.timezone,
        availabilityComments: emptyToUndefined(values.availabilityComments),
      },
      {
        onSuccess: () => {
          toast.success('Your application has been submitted', { description: 'We’ll be in touch shortly' });
          router.push(ROUTES.facilitatorApplications.url);
        },
        onError: (error) => {
          toast('Something went wrong', { description: error.message });
        },
      },
    );
  };

  const roundLine = formatRoundLine(round);

  return (
    <Shell subtitle={roundLine || undefined}>
      <div className="border-charcoal-light overflow-hidden rounded-lg border">
        <div className="bg-bluedot-normal h-[9px]" />
        <div className="flex flex-col gap-3 bg-white p-6 sm:p-9">
          {roundLine && <p className="text-size-xs text-bluedot-normal font-medium">{roundLine}</p>}
          <h1 className="text-size-xl text-bluedot-navy font-bold">Quick Apply</h1>
        </div>
      </div>

      <Section
        label="This cohort"
        title="Your facilitation request"
        description="We'll do our best to match your preference."
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label htmlFor="numGroupsToFacilitate" className="text-size-xs text-bluedot-navy font-semibold">
              # groups to facilitate <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="numGroupsToFacilitate"
                type="number"
                min={1}
                max={10}
                inputClassName="w-16"
                {...register('numGroupsToFacilitate', {
                  valueAsNumber: true,
                  required: true,
                  min: 1,
                  max: 10,
                })}
              />
              <span className="text-size-xs text-bluedot-navy/60">group(s)</span>
            </div>
            {errors.numGroupsToFacilitate && (
              <p className="text-size-xs text-red-600">Enter how many groups you can facilitate (1 to 10).</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="formFeedback" className="text-size-xs text-bluedot-navy font-semibold">
                Any requests or special information?
              </label>
              <p className="text-size-xxs text-bluedot-navy/60">e.g. on the desired amount/composition of groups</p>
            </div>
            <Textarea id="formFeedback" className="min-h-24 w-full" {...register('formFeedback')} />
          </div>
        </div>
      </Section>

      <Section
        label="Optional update"
        title="Help us match you to the right participants"
        description="Sharing what's new helps us put you where you'll have the most impact. Answer as many or as few as you like."
      >
        <div className="flex flex-col gap-3">
          {QUESTIONS.map((question) => (
            <QuestionCollapsible
              key={question.name}
              title={question.label}
              intro={question.intro}
              bullets={question.bullets}
              outro={question.outro}
            >
              <Textarea aria-label={question.label} className="min-h-24 w-full" {...register(question.name)} />
            </QuestionCollapsible>
          ))}
        </div>
      </Section>

      <Section
        label="Your availability"
        title={(
          <>
            Share your availability <span className="text-red-600">*</span>
          </>
        )}
        description="Provide your availability so we can schedule your discussions at times that suit you. It'll be saved as a default for your next application."
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex w-56 flex-col gap-1.5">
            <label htmlFor="timezone" className="text-size-xs text-bluedot-navy font-semibold">
              Timezone
            </label>
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <Select
                  ariaLabel="Timezone"
                  className="w-full"
                  options={offsets.map((offset) => ({ value: offset, label: offset }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => setValue('timeAv', {})}
            className="text-size-xxs text-bluedot-navy/60 cursor-pointer font-medium underline"
          >
            Clear availability selection
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <Controller
            control={control}
            name="timeAv"
            rules={{ validate: (v) => Object.values(v).some(Boolean) || 'Select at least one time slot.' }}
            render={({ field }) => <TimeAvailabilityGrid value={field.value} onChange={field.onChange} />}
          />
          {errors.timeAv && <p className="text-size-xs text-red-600">{errors.timeAv.message}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="availabilityComments" className="text-size-xs text-bluedot-navy font-semibold">
            Additional comments
          </label>
          <Textarea id="availabilityComments" className="min-h-24 w-full" {...register('availabilityComments')} />
        </div>
      </Section>

      <div className="border-charcoal-light rounded-lg border bg-white p-5">
        <CTALinkOrButton onClick={handleSubmit(onSubmit)} disabled={quickApply.isPending}>
          {quickApply.isPending ? 'Submitting…' : 'Submit'}
        </CTALinkOrButton>
      </div>
    </Shell>
  );
};

const QuickApplyPage = () => {
  const router = useRouter();
  const roundId = typeof router.query.round === 'string' ? router.query.round : undefined;

  const { data, isLoading, error } = trpc.facilitatorApplications.quickApplyPrefill.useQuery(
    { roundId: roundId ?? '' },
    { enabled: !!roundId, retry: false },
  );

  useEffect(() => {
    if (router.isReady && !roundId) {
      router.replace(ROUTES.facilitatorApplications.url);
    }
  }, [router, roundId]);

  if (error) {
    return (
      <Shell>
        <ErrorSection error={error} />
      </Shell>
    );
  }

  if (!roundId || isLoading || !data) {
    return (
      <Shell>
        <div className="flex justify-center py-16">
          <ProgressDots />
        </div>
      </Shell>
    );
  }

  return <QuickApplyForm roundId={roundId} round={data.round} prefill={data.prefill} />;
};

QuickApplyPage.rawLayout = true;

export default QuickApplyPage;
