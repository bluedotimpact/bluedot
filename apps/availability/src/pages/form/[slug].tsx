import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import {
  Box, Button, ErrorSection, Input, LegacyText, Textarea,
} from '@bluedot/ui';
import * as wa from 'weekly-availabilities';
import { SpinnerIcon } from '../../components/SpinnerIcon';
import { SubmitRequest } from '../api/public/submit';
import { GetFormResponse } from '../api/public/get-form';
import { TimeOffsetSelector } from '../../components/TimeOffsetSelector';
import { MINUTES_IN_UNIT, TimeAvailabilityInput } from '../../components/TimeAvailabilityInput';
import { formatOffsetFromMinutesToString, parseOffsetFromStringToMinutes } from '../../lib/offset';

type FormFieldData = {
  email: string;
  timezone: string;
  timeAv: Record<wa.WeeklyTime, boolean>;
  comment: string;
};

const toIntervals = (timeAv: Record<wa.WeeklyTime, boolean>): wa.Interval[] => {
  return wa.unionSchedules(Object.entries(timeAv)
    .filter(([, available]) => available)
    .map(([weeklyTime]) => [
      parseInt(weeklyTime),
      parseInt(weeklyTime) + MINUTES_IN_UNIT,
    ] as wa.Interval));
};

const shift = (intervals: wa.Interval[], offsetInMinutes: number): wa.Interval[] => {
  const shifted = intervals.flatMap(([b, e]) => {
    if (e - b > 10080) {
      throw new Error('Invalid weekly interval: greater than 10080 minutes');
    }

    let newB: number = b + offsetInMinutes;
    let newE: number = e + offsetInMinutes;

    while (newB < 0) {
      newB += 10080;
      newE += 10080;
    }

    while (newB > 10080) {
      newB -= 10080;
      newE -= 10080;
    }

    if (newE > 10080) {
      return [
        [0, newE - 10080],
        [newB, 10080],
      ] as wa.Interval[];
    }

    return [[newB, newE]] as wa.Interval[];
  });
  // Simplify and merge adjacent intervals
  return wa.unionSchedules(shifted);
};

const Form: React.FC<{
  title: string;
  minLength: number;
}> = ({ title, minLength }) => {
  const { query: { slug } } = useRouter();

  const {
    register, watch, control, handleSubmit,
  } = useFormContext<FormFieldData>();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<boolean | undefined>();
  const [error, setError] = useState<unknown | undefined>();
  const onSubmit = async (data: FormFieldData) => {
    setSubmitting(true);
    const intervals = shift(toIntervals(data.timeAv), parseOffsetFromStringToMinutes(data.timezone));

    try {
      const response = await axios.post(
        '/api/public/submit',
        {
          email: data.email,
          availability: wa.format(intervals),
          timezone: data.timezone,
          comments: data.comment,
        } satisfies SubmitRequest,
        {
          params: { slug },
        },
      );
      if (response.data.type === 'success') {
        setSuccess(true);
      } else {
        setError('An error occurred: server did not respond with success');
      }
    } catch (e) {
      setError(e);
    }
    setSubmitting(false);
  };

  const isValidEmail = () => {
    const email = watch('email');
    return email && email.length > 0 && email.includes('@');
  };

  const longEnoughInterval = () => {
    const timeAv = shift(toIntervals(watch('timeAv')), parseOffsetFromStringToMinutes(watch('timezone')));
    return timeAv.some(([start, end]) => end - start >= minLength);
  };

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Form submitted successfully.
      </div>
    );
  }

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <div className="py-16 px-4">
      <Box className="max-w-3xl mx-auto">
        <div className="m-12">
          <LegacyText.H1 className="!text-5xl">{title}</LegacyText.H1>
          <div className="space-y-2 mt-4">
            <p>Submit your availability so we can schedule your discussions at times that suit you.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-2 mt-6">
            <label className="text-size-xs text-stone-500 block">Email<br />
              <Input
                type="text"
                placeholder="you@example.com"
                className="w-full"
                {...register('email')}
              />
            </label>
            <TimeOffsetSelector control={control} name="timezone" />
          </div>
          <div className="text-size-xs text-stone-500 mt-6 mb-4 space-y-2">
            <p>Click and drag to indicate the times you will be regularly free during the course. It’s okay if you can’t make the odd week here and there - you can switch group for weeks where you can’t make your usual time.</p>
          </div>
          <TimeAvailabilityInput control={control} name="timeAv" />
          <label className="text-size-xs text-stone-500 block mt-4">(Optional) Additional comments<br />
            <Textarea
              className="w-full mt-1"
              {...register('comment')}
            />
          </label>
          <div className="mt-6">
            {submitting && <div className="flex w-full justify-center"><SpinnerIcon /></div>}
            {!submitting && (
            <>
              <p className="text-size-xs text-stone-500 mb-1">
                {!isValidEmail() && <>Input a valid email.<br /></>}
                {!longEnoughInterval() && `Fill out at least one interval of length at least ${minLength} minutes.`}
              </p>
              <Button onPress={() => handleSubmit(onSubmit)()} disabled={!isValidEmail() || !longEnoughInterval()}>
                Submit
              </Button>
            </>
            )}
          </div>
        </div>
      </Box>
    </div>
  );
};

type FormInfo =
  | { type: 'loading' }
  | { type: 'error', error: string }
  | { type: 'data', data: GetFormResponse };

const FormWrapper: React.FC = () => {
  const { query: { slug } } = useRouter();
  const searchParams = typeof window === 'undefined' ? new URLSearchParams() : new URL(document.location.href).searchParams;
  const formMethods = useForm<FormFieldData>({
    defaultValues: {
      email: searchParams.get('email') ?? '',
      timezone: formatOffsetFromMinutesToString(new Date().getTimezoneOffset()),
      timeAv: {},
    },
  });

  const [info, setInfo] = useState<FormInfo>();
  useEffect(() => {
    setInfo({ type: 'loading' });

    if (!slug) {
      return;
    }

    axios.get<GetFormResponse>('/api/public/get-form', { params: { slug } })
      .then((res) => setInfo({ type: 'data', data: res.data }))
      .catch((res) => setInfo({ type: 'error', error: String(res) }));
  }, [slug]);

  if (!info || info.type === 'loading') {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <SpinnerIcon />
      </div>
    );
  }

  if (info.type === 'error') {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        Error loading form: {info.error}
      </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <Form
        title={info.data.title}
        minLength={info.data.minimumLength}
      />
    </FormProvider>
  );
};

export default FormWrapper;
