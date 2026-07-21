import { cn } from './utils';

export type EyebrowProps = React.PropsWithChildren<{
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}>;

export const Eyebrow = ({
  children, className, id, style,
}: EyebrowProps) => {
  return (
    <p id={id} style={style} className={cn('text-size-xxs font-medium uppercase tracking-wide text-bluedot-normal', className)}>
      {children}
    </p>
  );
};
