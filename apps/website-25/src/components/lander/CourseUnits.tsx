import { ReactNode } from 'react';
import clsx from 'clsx';

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
  /* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */
  <div className={`p-6 bg-cream-normal rounded-lg ${className}`} id={id}>
    <p className="uppercase font-semibold text-gray-600">Unit {unitNumber}</p>
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
  <h3 className={`text-size-lg font-semibold my-2 ${className}`}>{children}</h3>
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
  <p className={`text-gray-600 ${className}`}>{children}</p>
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
