import clsx from 'clsx';

const BlueHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return (
  // TODO: add reckless neue bold
    <h2 className={clsx('text-size-xl font-serif font-bold text-center mb-12 text-bluedot-dark', className)}>{children}</h2>
  );
};

export default BlueHeader;
