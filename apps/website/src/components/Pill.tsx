import clsx from 'clsx';

export type PillProps = React.PropsWithChildren<{
  className?: string;
}>;

export const Pill = ({ children, className }: PillProps) => {
  return (
    <span className={clsx('inline-flex items-center rounded-full bg-bluedot-navy/[0.06] px-3 py-1 text-size-xxs font-semibold uppercase tracking-widest text-bluedot-navy/70', className)}>
      {children}
    </span>
  );
};
