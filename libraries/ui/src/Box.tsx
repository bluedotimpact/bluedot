import clsx from 'clsx';

export type BoxProps = React.PropsWithChildren<{
  className?: string
}>;

export const Box: React.FC<BoxProps> = ({ children, className }) => {
  return (
    <div className={clsx('border-2 border-stone-300', className)}>
      {children}
    </div>
  );
};
