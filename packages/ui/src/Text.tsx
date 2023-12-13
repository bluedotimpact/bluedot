import clsx from 'clsx';

type TextProps = React.PropsWithChildren<{
  className?: string;
}>;

export const H1 = ({
  children, className,
}: TextProps) => {
  return <h1 className={clsx('my-6 text-6xl font-serif', className)}>{children}</h1>;
};

export const H2 = ({
  children, className,
}: TextProps) => {
  return <h2 className={clsx('mt-6 mb-2 text-2xl font-bold', className)}>{children}</h2>;
};

export const HPrefix = ({
  children, className,
}: TextProps) => {
  return <p className={clsx('mt-6 -mb-6 text-sm font-bold text-stone-500 uppercase', className)}>{children}</p>;
};

export const P = ({
  children, className,
}: TextProps) => {
  return <p className={clsx('my-2 text-base', className)}>{children}</p>;
};
