import {
  type FieldPath, type FieldValues, type PathValue, type UseControllerProps, useController,
} from 'react-hook-form';
import { offsets } from '../lib/offset';
import { ComboBox } from './ComboBox';

const browserTimezoneName = new Intl.DateTimeFormat().resolvedOptions().timeZone;

export type TimeOffsetSelectorProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  className?: string;
} & UseControllerProps<TFieldValues, TName> & Required<Pick<UseControllerProps<TFieldValues, TName>, 'control'>>;

export const TimeOffsetSelector = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ className, ...props }: TimeOffsetSelectorProps<TFieldValues, TName>) => {
  const { field, fieldState } = useController(props);
  const options = offsets.map((s) => ({ value: s as PathValue<TFieldValues, TName>, label: s }));

  return (
    <div className={className}>
      <label className="text-size-xs text-stone-500 block">Time offset {!fieldState.isDirty ? `(Default: ${browserTimezoneName})` : ''}</label>
      <ComboBox options={options} control={props.control} name={field.name} />
    </div>
  );
};
