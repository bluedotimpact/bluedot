import { Heading, type HeadingProps } from 'react-aria-components';
import { cn } from './utils';

export type ModalTitleProps = HeadingProps;

// Rendered as a level-2 heading with `slot="title"` so react-aria wires the
// dialog's accessible name; Consumers can pass `id` (e.g. for a manual
// `aria-labelledby`) and extra classes for layout.
export const ModalTitle = ({ children, className, ...props }: ModalTitleProps) => {
  return (
    <Heading
      slot="title"
      level={2}
      className={cn('text-size-md text-bluedot-black leading-snug font-medium tracking-normal', className)}
      {...props}
    >
      {children}
    </Heading>
  );
};
