import {
  useState,
  ChangeEvent,
  useEffect,
  FC,
  useCallback,
} from 'react';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import {
  Section,
  ProgressDots,
  ErrorSection,
} from '@bluedot/ui';
import { H3, P } from '@bluedot/ui/src/Text';
import { FaFilter } from 'react-icons/fa6';
import { GetCoursesResponse } from '../../pages/api/courses';
import { CourseSearchCard } from './CourseSearchCard';

export type Option = {
  value: string;
  label: string;
};

export const CADENCE_OPTIONS: Option[] = [
  { value: 'MOOC', label: 'Self-paced' },
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
];
export const LEVEL_OPTIONS: Option[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

export type CourseFilters = {
  cadence: string[];
  level: string[];
};

type CourseDirectoryProps = {
  displayData: GetCoursesResponse | undefined;
  displayLoading: boolean;
  displayError: AxiosError<unknown, unknown> | null | undefined;
  noResults: boolean;
  setFilters: (filters: CourseFilters) => void;
};

export const CourseDirectory: FC<CourseDirectoryProps> = ({
  displayData,
  displayLoading,
  displayError,
  noResults,
  setFilters,
}) => {
  const [selectedCadences, setSelectedCadences] = useState<string[]>(CADENCE_OPTIONS.map((c) => c.value));
  const [selectedLevels, setSelectedLevels] = useState<string[]>(LEVEL_OPTIONS.map((l) => l.value));
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);

  const handleCadenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedCadences((prev) => (checked ? [...prev, value] : prev.filter((c) => c !== value)));
  };

  const handleLevelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedLevels((prev) => (checked ? [...prev, value] : prev.filter((l) => l !== value)));
  };

  useEffect(() => {
    setFilters({
      cadence: selectedCadences,
      level: selectedLevels,
    });
  }, [selectedCadences, selectedLevels, setFilters]);

  const showFilterActiveDot = selectedCadences.length !== CADENCE_OPTIONS.length || selectedLevels.length !== LEVEL_OPTIONS.length;

  const renderFilterGroup = useCallback((
    title: string,
    options: Option[],
    selectedValues: string[],
    onChange: (event: ChangeEvent<HTMLInputElement>) => void,
  ) => (
    <div>
      <P className="font-semibold mb-2">{title}</P>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${title.toLowerCase()}-${option.value}`}
            value={option.value}
            checked={selectedValues.includes(option.value)}
            onChange={onChange}
            className="form-checkbox size-4 text-blue-600 transition duration-150 ease-in-out"
          />
          <label htmlFor={`${title.toLowerCase()}-${option.value}`}>
            {option.label}
          </label>
        </div>
      ))}
    </div>
  ), []);

  return (
    <Section className="course-directory">
      <div className="course-directory__content flex flex-col md:grid gap-spacing-x grid-cols-[minmax(min-content,15%)_1fr]">
        <div className="course-directory__filter-section flex flex-col gap-4 w-full">
          <div className="course-directory__filter-header flex md:hidden justify-between items-center">
            <H3>Results</H3>
            <button
              type="button"
              className="course-directory__filter-button cursor-pointer p-2 block md:hidden relative"
              onClick={() => setFiltersOpenMobile(!filtersOpenMobile)}
            >
              <FaFilter />
              {showFilterActiveDot && (
                <svg className="absolute top-[5px] right-[4px]" width="8" height="8">
                  <circle cx="4" cy="4" r="4" fill="red" />
                </svg>
              )}
            </button>
          </div>
          <div className={clsx('course-directory__filters md:flex md:flex-col gap-6', filtersOpenMobile ? 'flex' : 'hidden')}>
            {renderFilterGroup('Cadence', CADENCE_OPTIONS, selectedCadences, handleCadenceChange)}
            {renderFilterGroup('Level', LEVEL_OPTIONS, selectedLevels, handleLevelChange)}
          </div>
        </div>
        <div className="course-directory__results flex flex-col gap-4">
          {noResults && (
            <>
              <P>No courses match the selected filters.</P>
              <H3>Browse all courses</H3>
            </>
          )}
          {displayLoading && <ProgressDots />}
          {displayError && <ErrorSection error={displayError} />}
          {displayData?.courses
            && displayData.courses.length > 0
            && displayData.courses.map((course) => (
              <CourseSearchCard
                key={course.title}
                description={course.shortDescription}
                cadence={course.cadence}
                level={course.level}
                averageRating={course.averageRating}
                imageSrc={course.image}
                title={course.title}
                url={course.path}
              />
            ))}
        </div>
      </div>
    </Section>
  );
};
