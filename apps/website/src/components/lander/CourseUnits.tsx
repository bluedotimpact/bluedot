import { ReactNode } from 'react';
import clsx from 'clsx';
import { H3, P } from '../Text';

interface UnitProps {
  unitNumber: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Unit component - container for a single course unit
 */
const Unit = ({
  unitNumber,
  children,
  className = '',
  id,
}: UnitProps) => (
  <div className={`p-6 bg-cream-normal rounded-lg ${className}`} id={id}>
    <P className="uppercase font-semibold text-gray-600">Unit {unitNumber}</P>
    {children}
  </div>
);

interface TitleProps {
  className?: string;
  children: ReactNode;
}

/**
 * Title component - title for a course unit
 */
const Title = ({
  children,
  className = '',
}: TitleProps) => (
  <H3 className={`text-size-lg font-semibold my-2 ${className}`}>{children}</H3>
);

interface DescriptionProps {
  className?: string;
  children: ReactNode;
}

/**
 * Description component - description for a course unit
 */
const Description = ({
  children,
  className = '',
}: DescriptionProps) => (
  <P className={`text-gray-600 ${className}`}>{children}</P>
);

interface CourseUnitsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Component for displaying course units using compound component pattern
 */
const CourseUnits = ({
  children,
  className,
}: CourseUnitsProps) => {
  return (
    <div className={clsx('grid md:grid-cols-2 gap-8', className)}>
      {children}
    </div>
  );
};

// Attach subcomponents
CourseUnits.Unit = Unit;
CourseUnits.Title = Title;
CourseUnits.Description = Description;

// Export the component
export default CourseUnits;
