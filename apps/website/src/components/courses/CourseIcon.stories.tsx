import type { Meta, StoryObj } from '@storybook/react';
import { CourseIcon } from './CourseIcon';

const meta: Meta<typeof CourseIcon> = {
  title: 'website/courses/CourseIcon',
  component: CourseIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof CourseIcon>;

export const FutureOfAi: Story = {
  args: {
    courseSlug: 'future-of-ai',
    size: 'xlarge',
  },
};

export const AiGovernance: Story = {
  args: {
    courseSlug: 'ai-governance',
    size: 'xlarge',
  },
};

export const AgiStrategy: Story = {
  args: {
    courseSlug: 'agi-strategy',
    size: 'xlarge',
  },
};

export const TechnicalAiSafety: Story = {
  args: {
    courseSlug: 'technical-ai-safety',
    size: 'xlarge',
  },
};

export const Biosecurity: Story = {
  args: {
    courseSlug: 'biosecurity',
    size: 'xlarge',
  },
};

export const TechnicalAiSafetyProject: Story = {
  args: {
    courseSlug: 'technical-ai-safety-project',
    size: 'xlarge',
  },
};

export const AllCourses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <CourseIcon courseSlug="future-of-ai" size="xlarge" />
      <CourseIcon courseSlug="ai-governance" size="xlarge" />
      <CourseIcon courseSlug="agi-strategy" size="xlarge" />
      <CourseIcon courseSlug="technical-ai-safety" size="xlarge" />
      <CourseIcon courseSlug="biosecurity" size="xlarge" />
      <CourseIcon courseSlug="technical-ai-safety-project" size="xlarge" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <CourseIcon courseSlug="technical-ai-safety-project" size="small" />
      <CourseIcon courseSlug="technical-ai-safety-project" size="medium" />
      <CourseIcon courseSlug="technical-ai-safety-project" size="large" />
      <CourseIcon courseSlug="technical-ai-safety-project" size="xlarge" />
    </div>
  ),
};

export const UnknownCourse: Story = {
  args: {
    courseSlug: 'unknown-course',
    size: 'xlarge',
  },
};

export const AllSizesUnknown: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <CourseIcon courseSlug="unknown-course" size="small" />
      <CourseIcon courseSlug="unknown-course" size="medium" />
      <CourseIcon courseSlug="unknown-course" size="large" />
      <CourseIcon courseSlug="unknown-course" size="xlarge" />
    </div>
  ),
};
