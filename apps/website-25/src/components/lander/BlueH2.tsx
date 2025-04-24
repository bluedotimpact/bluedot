import clsx from 'clsx';
import { H2 } from '../Text';

const BlueH2: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return (
    <H2 className={clsx('text-size-xl font-serif font-bold text-center mb-12 text-bluedot-dark', className)}>{children}</H2>
  );
};

export default BlueH2;
