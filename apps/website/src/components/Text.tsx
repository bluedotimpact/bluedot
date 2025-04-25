import clsx from 'clsx';

export type TextProps = React.PropsWithChildren<{
  className?: string;
}>;

export const H1 = ({
  children, className,
}: TextProps) => {
  return <h1 className={clsx('bluedot-h1', className)}>{children}</h1>;
};

export const H2 = ({
  children, className,
}: TextProps) => {
  return <h2 className={clsx('bluedot-h2', className)}>{children}</h2>;
};

export const H3 = ({
  children, className,
}: TextProps) => {
  return <h3 className={clsx('bluedot-h3', className)}>{children}</h3>;
};

export const H4 = ({
  children, className,
}: TextProps) => {
  return <h4 className={clsx('bluedot-h4', className)}>{children}</h4>;
};

export const P = ({
  children, className,
}: TextProps) => {
  return <p className={clsx('bluedot-p', className)}>{children}</p>;
};

export const A = ({
  children, className, ...aProps
}: TextProps & React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
  return <a className={clsx('bluedot-a', className)} {...aProps}>{children}</a>;
};

export const Blockquote = ({
  children, className,
}: TextProps) => {
  return <blockquote className={clsx('bluedot-blockquote', className)}>{children}</blockquote>;
};
