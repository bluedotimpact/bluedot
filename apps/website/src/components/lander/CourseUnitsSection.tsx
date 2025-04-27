import React, { ReactNode } from 'react';
import clsx from 'clsx';
import { H3, P } from '../Text';

type CourseUnitProps = {
  unitNumber: string;
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * CourseUnit component - container for a single course unit
 */
export const CourseUnit: React.FC<CourseUnitProps> = ({
  unitNumber,
  children,
  className = '',
  id,
}) => (
  <div className={`p-6 bg-cream-normal rounded-lg ${className}`} id={id}>
    <P className="uppercase font-semibold text-gray-600">Unit {unitNumber}</P>
    {children}
  </div>
);

type CourseUnitTitleProps = {
  className?: string;
  children: ReactNode;
};

/**
 * CourseUnitTitle component - title for a course unit
 */
export const CourseUnitTitle: React.FC<CourseUnitTitleProps> = ({
  children,
  className = '',
}) => (
  <H3 className={`text-size-lg font-semibold my-2 ${className}`}>{children}</H3>
);

type CourseUnitDescriptionProps = {
  className?: string;
  children: ReactNode;
};

/**
 * CourseUnitDescription component - description for a course unit
 */
export const CourseUnitDescription: React.FC<CourseUnitDescriptionProps> = ({
  children,
  className = '',
}) => (
  <P className={`text-gray-600 ${className}`}>{children}</P>
);

type CourseUnitsSectionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Section component for displaying course units using compound component pattern
 */
const CourseUnitsSection: React.FC<CourseUnitsSectionProps> = ({
  children,
  className,
}) => {
  return (
    <div className={clsx('grid md:grid-cols-2 gap-8', className)}>
      {children}
    </div>
  );
};

export default CourseUnitsSection;
