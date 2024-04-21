import clsx from 'clsx';

export interface TextProps {
  className?: string;
}

export const H1: React.FC<React.PropsWithChildren<TextProps>> = ({ children, className }) => {
  return <h1 className={clsx('text-3xl font-bold mb-6', className)}>{children}</h1>;
};
