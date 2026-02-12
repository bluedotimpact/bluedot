import clsx from 'clsx';
import { ClickTarget, type ClickTargetProps } from './ClickTarget';

export type TextProps = React.PropsWithChildren<{
  className?: string;
}>;

export const H1 = ({
  children, className,
}: TextProps) => {
  return <h1 className={clsx('bluedot-h1 not-prose', className)}>{children}</h1>;
};

export const H2 = ({
  children, className,
}: TextProps) => {
  return <h2 className={clsx('bluedot-h2 not-prose', className)}>{children}</h2>;
};

export const H3 = ({
  children, className,
}: TextProps) => {
  return <h3 className={clsx('bluedot-h3 not-prose', className)}>{children}</h3>;
};

export const H4 = ({
  children, className,
}: TextProps) => {
  return <h4 className={clsx('bluedot-h4 not-prose', className)}>{children}</h4>;
};

export const P = ({
  children, className,
}: TextProps) => {
  return <p className={clsx('bluedot-p not-prose', className)}>{children}</p>;
};

export const A = ({
  children, className, href, ...clickTargetProps
}: TextProps & { href?: string | undefined } & Omit<ClickTargetProps, 'url'>) => {
  return <ClickTarget className={clsx('bluedot-a not-prose', className)} url={href} {...clickTargetProps}>{children}</ClickTarget>;
};
