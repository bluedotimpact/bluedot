import axios from 'axios';
import { useRouter } from 'next/router';
import {
  useEffect, useRef, useState, useMemo,
} from 'react';
import {
  Controller, FormProvider, useForm, useFormContext,
} from 'react-hook-form';
import Select from 'react-select';
import {
  Box, Button, H1, Input,
  Textarea,
} from '@bluedot/ui';
import clsx from 'clsx';
import { SpinnerIcon } from '../../components/SpinnerIcon';
import { parseOffsetFromStringToMinutes, offsets } from '../../lib/date';
import { pad, snapToRect } from '../../lib/util';
import { SubmitRequest } from '../api/public/submit';
import { GetFormResponse } from '../api/public/get-form';

// types
type Timepoint = { day: number; minutes: number };
type Coord = { day: number; time: number };

const serializeCoord = ({ day, time }: Coord) => `${day},${time}`;

// consts
const MINUTES_IN_UNIT = 30;
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const browserTimezoneName = new Intl.DateTimeFormat().resolvedOptions().timeZone;

// utils
const normalizeBlock = ({
  anchor: a,
  cursor: c,
}: {
  anchor: Coord;
  cursor: Coord;
}) => {
  return {
    min: { day: Math.min(a.day, c.day), time: Math.min(a.time, c.time) },
    max: { day: Math.max(a.day, c.day), time: Math.max(a.time, c.time) },
  };
};

const isWithin = (
  { min, max }: { min: Coord; max: Coord },
  { day, time }: Coord,
) => {
  return (
    min.time <= time && max.time >= time && min.day <= day && max.day >= day
  );
};

const daySymbols = ['M', 'T', 'W', 'R', 'F', 'S', 'U'];
const stringifyTimepoint = ({ day, minutes }: Timepoint) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const dayName = daySymbols[(day + 7) % 7];
  return `${dayName}${pad(hour)}:${pad(minute)}`;
};

const shiftTimepoint = ({ day, minutes }: Timepoint, timezoneOrOffsetInMinutes: number | string) => {
  const offsetInMinutes = typeof timezoneOrOffsetInMinutes === 'number'
    ? timezoneOrOffsetInMinutes
    : parseOffsetFromStringToMinutes(timezoneOrOffsetInMinutes);

  let newMinutes = minutes + offsetInMinutes;

  let newDay = day;
  if (newMinutes < 0) {
    newDay -= 1;
    newMinutes += 1440;
  }
  if (newMinutes >= 1440) {
    newDay += 1;
    newMinutes -= 1440;
  }
  newDay = (newDay + 7) % 7;

  return { day: newDay, minutes: newMinutes };
};

const timepointToMinutes = ({ day, minutes }: Timepoint) => {
  return day * 1440 + minutes;
};

const coalesceTimeAv = (
  timeAv: { [serialisedCoord: string]: boolean },
  timezone: string,
) => {
  const nIntervals = (24 * 60) / MINUTES_IN_UNIT;

  const timepoints = [];
  for (let day = 0; day < days.length; day++) {
    for (let time = 0; time < nIntervals; time++) {
      const key = serializeCoord({ day, time });

      if (timeAv[key]) {
        const minutes = time * MINUTES_IN_UNIT;
        timepoints.push(shiftTimepoint({ day, minutes }, timezone));
      }
    }
  }
  timepoints.sort((a, b) => (a.day - b.day) * 1440 + a.minutes - b.minutes);

  const intervals = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const timepoint of timepoints) {
    const lastInterval = intervals[intervals.length - 1];

    // If this is a separate interval, create a new interval
    if (
      !lastInterval
      || lastInterval.end.day !== timepoint.day
      || lastInterval.end.minutes !== timepoint.minutes
    ) {
      intervals.push({ start: timepoint, end: timepoint });
    }

    intervals[intervals.length - 1]!.end = shiftTimepoint(timepoint, MINUTES_IN_UNIT);
  }

  return intervals;
};

const serializeTimeAv = (
  timeAv: { [serialisedCoord: string]: boolean },
  timezone: string,
) => {
  return coalesceTimeAv(timeAv, timezone)
    .map(({ start, end }) => `${stringifyTimepoint(start)} ${stringifyTimepoint(end)}`)
    .join(', ');
};

interface FormData {
  email: string;
  timezone: string;
  timeAv: { [serialisedCoord: string]: boolean };
  comment: string;
}

const TimeAvWidget: React.FC<{ show24: boolean }> = ({ show24 }) => {
  const { watch, setValue } = useFormContext<FormData>();

  const startTime = show24 ? 0 : (8 * 60) / MINUTES_IN_UNIT;
  const endTime = show24
    ? (24 * 60) / MINUTES_IN_UNIT
    : (23 * 60) / MINUTES_IN_UNIT;

  const cellCoords: Coord[] = [];
  const cellRefs: ({ ref: HTMLDivElement | null; coord: Coord } | null)[] = useMemo(() => [], []);
  const times = [];
  for (let i = startTime; i <= endTime; i++) {
    times.push(i);
    if (i !== endTime) {
      for (let d = 0; d < days.length; d++) {
        cellCoords.push({ day: d, time: i });
        cellRefs.push(null);
      }
    }
  }

  const timeAv = watch('timeAv');

  const timeToLabel = (time: number) => {
    const minutes = time * MINUTES_IN_UNIT;
    if (minutes < 0 || minutes > 1440) throw new Error(`Invalid time: ${time} (${minutes} mins)`);
    const hours = Math.floor(minutes / 60);
    const minutesRemaining = minutes - hours * 60;
    return `${hours.toString().padStart(2, '0')}:${minutesRemaining.toString().padStart(2, '0')}`;
  };

  const [dragState, setDragState] = useState<{
    dragging: false | 'neg' | 'pos';
    anchor?: Coord;
    cursor?: Coord;
  }>({ dragging: false });

  const dragStart = (cell: Coord) => {
    setDragState({
      dragging: timeAv[serializeCoord(cell)] ? 'neg' : 'pos',
      anchor: cell,
      cursor: cell,
    });
  };

  const mainGrid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mouseMoveListener = (e: MouseEvent) => {
      if (!dragState.dragging || !mainGrid.current) return;

      const mousepos = { x: e.clientX, y: e.clientY };
      const { x, y } = snapToRect(mainGrid.current.getBoundingClientRect(), mousepos);

      const cell = cellRefs.find((c) => {
        if (!c?.ref) return false;
        const {
          top, bottom, left, right,
        } = c.ref.getBoundingClientRect();

        return (x >= left && x <= right && y >= top && y <= bottom);
      });

      if (cell) {
        setDragState((prev) => ({ ...prev, cursor: cell.coord }));
      }
    };
    document.addEventListener('mousemove', mouseMoveListener);

    const mouseUpListener = () => {
      if (!dragState.dragging || !dragState.anchor || !dragState.cursor) return;
      const { min, max } = normalizeBlock({
        anchor: dragState.anchor,
        cursor: dragState.cursor,
      });

      const targetVal = dragState.dragging === 'pos';
      for (let { day } = min; day <= max.day; day++) {
        for (let { time } = min; time <= max.time; time++) {
          setValue(`timeAv.${serializeCoord({ day, time })}`, targetVal);
        }
      }
      setDragState({ dragging: false });
    };
    document.addEventListener('mouseup', mouseUpListener);

    return () => {
      document.removeEventListener('mousemove', mouseMoveListener);
      document.removeEventListener('mouseup', mouseUpListener);
    };
  }, [cellRefs, dragState, mainGrid, setValue]);

  return (
    <div className="w-full touch-none text-xs text-stone-500">
      <div className="flex">
        <div className="w-12" />
        <div className="grid grid-cols-7 w-full text-center">
          {days.map((day) => <div key={day}>{day.slice(0, 1)}</div>)}
        </div>
      </div>
      <div className="flex">
        <div className="w-12">
          {times.map((time, i) => i % 2 === 0 && (
            <div key={time} className="h-8 flex justify-end px-1 py-px">
              <div className="-translate-y-2">{timeToLabel(time)}</div>
            </div>
          ))}
        </div>
        <div className="w-full">
          <div
            ref={mainGrid}
            className="grid grid-cols-7 bg-white border-t border-l border-gray-800 w-full"
          >
            {cellCoords.map((coord, i) => {
              const isBlocked = timeAv[serializeCoord(coord)];

              const borderStyle = Math.floor(i / 7) % 2 === 0
                ? '[border-bottom-style:dotted]'
                : 'border-solid';

              const overlay = dragState.dragging
                && dragState.anchor
                && dragState.cursor
                && isWithin(
                  normalizeBlock({
                    anchor: dragState.anchor,
                    cursor: dragState.cursor,
                  }),
                  coord,
                );

              const overlayKind = overlay && dragState.dragging === 'pos'
                ? 'bg-green-400'
                : dragState.dragging === 'neg' && 'bg-purple-400';

              return (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  ref={(ref) => { cellRefs[i] = { ref, coord }; }}
                  className={clsx(`relative h-4 border-gray-800 border-r border-b ${borderStyle}`, isBlocked && 'bg-green-400')}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    dragStart(coord);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    dragStart(coord);
                  }}
                >
                  <div className="w-full h-full" draggable={false} />
                  {overlay && <div className={`w-full h-full ${overlayKind} opacity-75 absolute inset-0 pointer-events-none`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeAv: React.FC = () => {
  const [show24, setShow24] = useState(false);
  const { setValue } = useFormContext<FormData>();

  return (
    <div className="sm:flex gap-4">
      <TimeAvWidget show24={show24} />
      <div className="sm:w-40 sm:mt-4 flex sm:flex-col gap-2">
        <Button className="w-full text-sm" onPress={() => setShow24(!show24)}>
          Show {show24 ? 'less' : 'more'}
        </Button>
        <Button className="w-full text-sm" onPress={() => setValue('timeAv', {})}>
          Clear
        </Button>
      </div>
    </div>
  );
};

const TimeOffsetSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { control } = useFormContext<FormData>();
  const options = offsets.map((s) => ({ value: s, label: s }));

  const [detected, setDetected] = useState(true);

  return (
    <div className={className}>
      <label className="text-xs text-stone-500 block">Time offset {detected ? `(Automatically set to ${browserTimezoneName})` : ''}</label>
      <Controller
        render={({ field: { onChange, value, ref } }) => (
          <Select
            ref={ref}
            options={options}
            className="w-full"
            value={{ value, label: value }}
            onChange={(val) => {
              setDetected(false);
              onChange(val?.value);
            }}
            theme={(theme) => ({
              ...theme,
              borderRadius: 2,
              colors: {
                ...theme.colors,
                primary: '#0037FF',
              },
            })}
            classNames={{
              control: (state) => clsx('!border-2 !border-stone-200 !rounded-sm !min-h-0 !shadow-none', state.isFocused && '!border-bluedot-normal'),
              valueContainer: () => '!py-0',
              dropdownIndicator: () => '!py-0',
            }}
          />
        )}
        name="timezone"
        control={control}
      />
    </div>
  );
};

const Form: React.FC<{
  title: string;
  minLength: number;
}> = ({ title, minLength }) => {
  const { query: { slug } } = useRouter();

  const { getValues, register, watch } = useFormContext<FormData>();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<boolean | undefined>();
  const [error, setError] = useState<unknown | undefined>();
  const submit = async () => {
    setSubmitting(true);
    const serializedTimeAv = serializeTimeAv(getValues('timeAv'), getValues('timezone'));

    try {
      const response = await axios.post(
        '/api/public/submit',
        {
          email: getValues('email'),
          availability: serializedTimeAv,
          timezone: getValues('timezone'),
          comments: getValues('comment'),
        } satisfies SubmitRequest,
        {
          params: { slug },
        },
      );
      if (response.data.type === 'success') {
        setSuccess(true);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(e);
      console.log(e);
    }
    setSubmitting(false);
  };

  const isValidEmail = () => {
    const email = watch('email');
    return email && email.length > 0 && email.includes('@');
  };

  const longEnoughInterval = () => {
    const timeAv = coalesceTimeAv(getValues('timeAv'), getValues('timezone'));
    return timeAv.some(
      ({ start, end }) => timepointToMinutes(end) - timepointToMinutes(start) >= minLength
        // at the end of the week
        || (timepointToMinutes(start) + minLength <= 10080 && timepointToMinutes(end) === 0),
    );
  };

  if (success) {
    return (
      <div className="flex justify-center items-center h-screen">
        Form submitted successfully.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        Error occurred. Please contact us for support.
      </div>
    );
  }

  return (
    <div className="bg-cream-normal py-16 px-4">
      <Box className="max-w-2xl mx-auto">
        <div className="m-12">
          <H1 className="!text-5xl">{title}</H1>
          <div className="space-y-2 mt-4">
            <p>Submit your availability so we can schedule your discussion sessions at times that suit you.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-2 mt-6">
            <label className="text-xs text-stone-500 block">Email<br />
              <Input
                type="text"
                placeholder="you@example.com"
                className="w-full"
                {...register('email')}
              />
            </label>
            <TimeOffsetSelector />
          </div>
          <div className="text-xs text-stone-500 mt-6 mb-4 space-y-2">
            <p>Click and drag to indicate the times you will be regularly free during the course. It’s okay if you can’t make the odd week here and there - you can switch cohort for weeks where you can’t make your usual time.</p>
          </div>
          <TimeAv />
          <label className="text-xs text-stone-500 block mt-4">(Optional) Additional comments<br />
            <Textarea
              className="w-full mt-1"
              {...register('comment')}
            />
          </label>
          <div className="mt-6">
            {submitting && <div className="flex w-full justify-center"><SpinnerIcon /></div>}
            {!submitting && (
            <>
              <p className="text-xs text-stone-500 mb-1">
                {!isValidEmail() && <>Input a valid email.<br /></>}
                {!longEnoughInterval() && `Fill out at least one interval of length at least ${minLength} minutes.`}
              </p>
              <Button onPress={submit} disabled={!isValidEmail() || !longEnoughInterval()}>
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
  const browserTimezoneOffset = -new Date().getTimezoneOffset();
  const formMethods = useForm<FormData>({
    defaultValues: {
      email: searchParams.get('email') ?? '',
      timezone: `UTC${browserTimezoneOffset > 0 ? '+' : '-'}${pad(Math.floor(Math.abs(browserTimezoneOffset) / 60))}:${pad(Math.floor(Math.abs(browserTimezoneOffset) % 60))}`,
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
