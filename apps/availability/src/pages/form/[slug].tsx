import axios from 'axios';
import { useRouter } from 'next/router';
import {
  useEffect, useRef, useState, useMemo,
} from 'react';
import {
  Controller, FormProvider, useForm, useFormContext,
} from 'react-hook-form';
import Select from 'react-select';
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
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
    <div className="w-full touch-none">
      <div className="flex">
        <div className="w-12" />
        <div className="grid grid-cols-7 w-full text-sm sm:text-base">
          {days.map((day) => <div key={day} className="h-8 mx-auto">{day}</div>)}
        </div>
      </div>
      <div className="flex">
        <div className="w-12">
          {times.map((time, i) => i % 2 === 0 && (
            <div key={time} className="h-8 text-xs text-gray-700 flex justify-end px-1 py-px">
              <div className="-translate-y-2">{timeToLabel(time)}</div>
            </div>
          ))}
        </div>
        <div className="w-full">
          <div
            ref={mainGrid}
            className="grid grid-cols-7 bg-gray-400 border-t border-l border-gray-800 w-full"
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
                  className={`relative h-4 ${
                    isBlocked ? 'bg-green-400' : 'bg-red-50'
                  } border-gray-800 border-r border-b ${borderStyle}`}
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
    <div className="mt-4 flex justify-between space-x-2">
      <TimeAvWidget show24={show24} />
      <div className="w-20 sm:w-32 flex flex-col justify-start items-end space-y-2">
        <div className="h-6" />
        <button
          type="button"
          className="w-full px-1 py-1 text-xs text-gray-500 rounded border border-gray-300 hover:shadow"
          onClick={() => setShow24(!show24)}
        >
          {show24 ? (
            <>
              <span className="hidden sm:inline">Show less hours</span>
              <span className="sm:hidden">Less hours</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Show 24 hours</span>
              <span className="sm:hidden">24 hours</span>
            </>
          )}
        </button>
        <button type="button" className="w-full px-1 py-1 text-xs text-gray-500 rounded border border-gray-300 hover:shadow" onClick={() => setValue('timeAv', {})}>
          Clear
        </button>
      </div>
    </div>
  );
};

const TimeOffsetSelector: React.FC = () => {
  const { control } = useFormContext<FormData>();
  const options = offsets.map((s) => ({ value: s, label: s }));

  const [detected, setDetected] = useState(true);

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1">Time offset ({detected ? `Automatically set for ${browserTimezoneName}` : 'Overwritten'})</label>
      <Controller
        render={({ field: { onChange, value, ref } }) => (
          <Select
            ref={ref}
            options={options}
            className="w-60"
            value={{ value, label: value }}
            onChange={(val) => {
              setDetected(false);
              onChange(val?.value);
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
    <div className="text-gray-700">
      <div className="max-w-md mx-auto my-4 px-4 sm:p-0">
        <div className="text-2xl">{title}</div>
        <div className="text-lg">Time availability form</div>
        <div className="space-y-2 mt-4 text-sm">
          <p>Submit your time availability so that we can schedule the weekly discussion sessions at times that suit you. Your discussion sessions will be at the same time each week.</p>
          <p><b>Please indicate all the times that you will be regularly free during the weeks of the course.</b></p>
          <p>It’s okay if you can’t make the odd week here and there - there will be an option to switch cohort for a week if you can’t make your usual time.</p>
        </div>
      </div>
      <div className="bg-gray-50 min-h-screen py-4">
        <div className="max-w-md mx-auto px-4 sm:p-0 text-sm space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-1">Email (Don't change if pre-filled)<br />
              <input
                type="text"
                placeholder="Email"
                className="px-3 py-2 text-gray-700 rounded border focus:outline focus:outline-gray-400 w-60"
                {...register('email')}
              />
            </label>
          </div>
          <TimeOffsetSelector />
          <div className="h-2" />
          <div className="text-xs text-gray-500 space-y">
            <p>Click and drag to select your availability. Times are in your selected time offset - note that daylight savings may change your offset during the course, but your cohort will usually stay at the same UTC time.</p>
            <p />
          </div>
          <TimeAv />
          <div>
            <textarea
              cols={40}
              rows={3}
              placeholder="Additional comments"
              className="px-2 py-1 w-full text-xs text-gray-700 rounded border focus:outline focus:outline-gray-400"
              {...register('comment')}
            />
          </div>
          <div className="flex items-center pt-6 pb-16 setup space-x-3">
            {submitting && <div className="flex w-full justify-center"><SpinnerIcon /></div>}
            {!submitting && (
            <>
              <button type="button" onClick={submit} disabled={!isValidEmail() || !longEnoughInterval()}>
                Submit
              </button>
              <p className="text-[10px] text-gray-500 leading-3">
                {!isValidEmail() && 'Please input a valid email. '}
                {!longEnoughInterval() && `Please fill out at least one interval of length at least ${minLength} minutes.`}
              </p>
            </>
            )}
          </div>
        </div>
      </div>
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
      <div className="w-full h-screen flex justify-center items-center text-gray-700">
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
