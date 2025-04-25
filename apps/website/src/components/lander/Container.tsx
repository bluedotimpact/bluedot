import React from 'react';
import clsx from 'clsx';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  bgClassname?: string;
}

/**
 * Provides consistent max-width and padding
 */
const Container: React.FC<ContainerProps> = ({ children, bgClassname, className }) => {
  if (bgClassname) {
    return (
      <div className={bgClassname}><Container className={className}>{children}</Container></div>
    );
  }

  return <section className={clsx('max-w-5xl mx-auto px-4 sm:px-8', className)}>{children}</section>;
};

export default Container;
