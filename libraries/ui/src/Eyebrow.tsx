import { cn } from './utils';

export type EyebrowProps = React.PropsWithChildren<{
  className?: string;
}>;

export const Eyebrow = ({ children, className }: EyebrowProps) => {
  return (
    <p className={cn('text-size-xxs font-medium uppercase tracking-wide text-bluedot-normal', className)}>
      {children}
    </p>
  );
};
