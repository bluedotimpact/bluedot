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
    <span id={id} style={style} className={cn('block text-size-xxs font-medium uppercase tracking-wide text-accent', className)}>
      {children}
    </span>
  );
};
