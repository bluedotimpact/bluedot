import { createContext, useContext, useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from './utils';

export type FieldContextValue = {
  id?: string;
  /** For controls `<label for>` can't name (react-aria Select). */
  labelId?: string;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

type FieldControlProps = {
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
};

/** Merges the surrounding Field's wiring into a control's props. Explicit props win. No-op outside a Field. */
export const useFieldControlProps = <P extends FieldControlProps>(props: P): P => {
  const field = useContext(FieldContext);
  if (!field) return props;

  return {
    ...props,
    id: props.id ?? field.id,
    required: props.required ?? field.required,
    'aria-describedby': joinIds(props['aria-describedby'], field.describedBy),
    'aria-invalid': props['aria-invalid'] ?? (field.invalid ? true : undefined),
  };
};

const joinIds = (...ids: (string | undefined)[]): string | undefined => {
  const joined = ids.filter(Boolean).join(' ');
  return joined === '' ? undefined : joined;
};

const LABEL_STYLES = 'text-size-sm font-semibold leading-normal text-primary';
const DESCRIPTION_STYLES = 'text-size-xs leading-normal text-secondary';
const ERROR_STYLES = 'text-size-xs leading-normal text-error-fg';

// Decorative; native `required` on the control carries the semantics.
const RequiredMarker = () => <span aria-hidden className="text-error-fg"> *</span>;

export type FieldProps = {
  /** Used as the control's `id`. Put it here, not on the control, so the label stays attached. */
  id?: string;
  /** Omit when the control carries its own visible label, e.g. a single Checkbox. */
  label?: ReactNode;
  description?: ReactNode;
  /** Non-empty error marks the control invalid and describes it with the message. */
  error?: ReactNode;
  required?: boolean;
  /** Applied to the root. */
  className?: string;
  /** One control. It must call `useFieldControlProps`. */
  children: ReactNode;
};

export const Field = ({
  id: explicitId, label, description, error, required, className, children,
}: FieldProps) => {
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = !!error;

  const describedBy = joinIds(description ? descriptionId : undefined, invalid ? errorId : undefined);

  return (
    <FieldContext.Provider value={{
      id, labelId: label ? labelId : undefined, describedBy, invalid, required,
    }}
    >
      <div className={cn('flex w-full flex-col gap-2', className)}>
        {(Boolean(label) || Boolean(description)) && (
          <div className="flex flex-col gap-1">
            {label && (
              <label id={labelId} htmlFor={id} className={LABEL_STYLES}>
                {label}
                {required && <RequiredMarker />}
              </label>
            )}
            {description && <p id={descriptionId} className={DESCRIPTION_STYLES}>{description}</p>}
          </div>
        )}
        {children}
        {invalid && <p id={errorId} className={ERROR_STYLES}>{error}</p>}
      </div>
    </FieldContext.Provider>
  );
};

export type FieldSetProps = {
  legend: ReactNode;
  description?: ReactNode;
  /** Non-empty error marks every option invalid and describes the group with the message. */
  error?: ReactNode;
  /** Marker only. Validate "pick at least one" in the form; native `required` on each option would mean "check all". */
  required?: boolean;
  /** Applied to the fieldset. */
  className?: string;
  /** Checkbox or Radio options. Each calls `useFieldControlProps`. */
  children: ReactNode;
};

export const FieldSet = ({
  legend, description, error, required, className, children,
}: FieldSetProps) => {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const invalid = !!error;

  const describedBy = joinIds(description ? descriptionId : undefined, invalid ? errorId : undefined);

  return (
    <FieldContext.Provider value={{ describedBy, invalid }}>
      <fieldset
        aria-describedby={describedBy}
        className={cn('m-0 flex w-full min-w-0 flex-col gap-2 border-0 p-0', className)}
      >
        {/* Legend must be the first child for screen readers to announce it with the group.
            A legend is not a flex item, so the fieldset's `gap` does not apply to it; use margin. */}
        <legend className={cn(LABEL_STYLES, 'p-0', description ? 'mb-1' : 'mb-2')}>
          {legend}
          {required && <RequiredMarker />}
        </legend>
        {description && <p id={descriptionId} className={DESCRIPTION_STYLES}>{description}</p>}
        {children}
        {invalid && <p id={errorId} className={ERROR_STYLES}>{error}</p>}
      </fieldset>
    </FieldContext.Provider>
  );
};
