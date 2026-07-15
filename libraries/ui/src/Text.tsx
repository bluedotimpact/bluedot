import { ClickTarget, type ClickTargetProps } from './ClickTarget';
import { cn } from './utils';

export type TextProps = React.PropsWithChildren<{
  className?: string;
}>;

export const H1 = ({
  children, className,
}: TextProps) => {
  return <h1 className={cn('bluedot-h1 not-prose', className)}>{children}</h1>;
};

export const H2 = ({
  children, className,
}: TextProps) => {
  return <h2 className={cn('bluedot-h2 not-prose', className)}>{children}</h2>;
};

export const H3 = ({
  children, className,
}: TextProps) => {
  return <h3 className={cn('bluedot-h3 not-prose', className)}>{children}</h3>;
};

export const H4 = ({
  children, className,
}: TextProps) => {
  return <h4 className={cn('bluedot-h4 not-prose', className)}>{children}</h4>;
};

export const P = ({
  children, className,
}: TextProps) => {
  return <p className={cn('bluedot-p not-prose', className)}>{children}</p>;
};

export const A = ({
  children, className, href, ...clickTargetProps
}: TextProps & { href?: string | undefined } & Omit<ClickTargetProps, 'url'>) => {
  return <ClickTarget className={cn('bluedot-a not-prose', className)} url={href} {...clickTargetProps}>{children}</ClickTarget>;
};
