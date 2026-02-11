import clsx from 'clsx';
import {
  useController, type UseControllerProps, type FieldPath, type FieldValues, type PathValue,
} from 'react-hook-form';
import Select from 'react-select';

export type ComboBoxProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  className?: string;
  options: { value: PathValue<TFieldValues, TName>; label: string }[];
} & UseControllerProps<TFieldValues, TName> & Required<Pick<UseControllerProps<TFieldValues, TName>, 'control'>>;

export const ComboBox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ options, ...props }: ComboBoxProps<TFieldValues, TName>) => {
  const { field } = useController(props);

  return (
    <Select<{ value: PathValue<TFieldValues, TName>; label: string }>
      options={options}
      className="w-full"
      value={{ value: field.value, label: field.value }}
      onBlur={() => field.onBlur()}
      onChange={(val) => {
        field.onChange(val?.value);
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 2,
        colors: {
          ...theme.colors,
          primary: '#1144CC',
        },
      })}
      classNames={{
        control: (state) => clsx('!border-2 !rounded-sm !min-h-0 !shadow-none', state.isFocused ? '!border-bluedot-normal' : '!border-stone-200'),
        valueContainer: () => '!py-0',
        dropdownIndicator: () => '!py-0',
      }}
    />
  );
};
