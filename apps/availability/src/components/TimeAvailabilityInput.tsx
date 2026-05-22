import { useState } from 'react';
import {
  type FieldPath, type FieldValues, type UseControllerProps,
  useController,
} from 'react-hook-form';
import { CTALinkOrButton, TimeAvailabilityGrid } from '@bluedot/ui';
import type * as wa from 'weekly-availabilities';

export type TimeAvailabilityInputProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  className?: string;
} & UseControllerProps<TFieldValues, TName> & Required<Pick<UseControllerProps<TFieldValues, TName>, 'control'>>;

export const TimeAvailabilityInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ className: _className, ...props }: TimeAvailabilityInputProps<TFieldValues, TName>) => {
  const { field } = useController(props);
  const [show24, setShow24] = useState(false);

  return (
    <div className="sm:flex gap-4">
      <TimeAvailabilityGrid
        value={field.value}
        onChange={(v) => field.onChange(v as Record<wa.WeeklyTime, boolean>)}
        startHour={show24 ? 0 : 8}
        endHour={show24 ? 24 : 23}
      />
      <div className="sm:w-40 sm:mt-4 flex sm:flex-col gap-2">
        <CTALinkOrButton className="w-full" variant="secondary" onClick={() => setShow24(!show24)}>
          Show {show24 ? 'less' : 'more'}
        </CTALinkOrButton>
      </div>
    </div>
  );
};
