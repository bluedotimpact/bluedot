/**
 * Custom icon catalog for the website. Every icon here is a hand-rolled SVG —
 * see `Icons.stories.tsx` (or storybook.k8s.bluedot.org → website-icons) for
 * the rendered gallery.
 *
 * Adding a new icon? Default to a library icon first:
 *   1. `react-icons/fa6` (Font Awesome 6) — preferred when an equivalent exists.
 *   2. `react-icons/pi` (Phosphor) — already used in lander course-content blocks.
 * Only add a new file here when no library icon matches and the design is
 * genuinely bespoke. New icons must implement `IconProps` (see `types.ts`)
 * for consistency with the rest of the catalog (Josh's #2294).
 *
 * Adding a new icon to this folder? Re-export it from this barrel so consumers
 * can import via `from '../components/icons'` rather than the per-file path.
 */

export type { IconProps } from './types';

export { ArrowDownIcon } from './ArrowDownIcon';
export { ArrowRightIcon } from './ArrowRightIcon';
export { CheckIcon } from './CheckIcon';
export { CheckmarkIcon } from './CheckmarkIcon';
export { ChevronRightIcon } from './ChevronRightIcon';
export { ChunkIcon } from './ChunkIcon';
export { CircledCheckmarkIcon } from './CircledCheckmarkIcon';
export { ClockIcon } from './ClockIcon';
export { ClockUserIcon } from './ClockUserIcon';
export { DocumentIcon } from './DocumentIcon';
export { ErrorIcon } from './ErrorIcon';
export { ExternalLinkIcon } from './ExternalLinkIcon';
export { InfoIcon } from './InfoIcon';
export { MoonStarsIcon } from './MoonStarsIcon';
export { MusicNoteIcon } from './MusicNoteIcon';
export { PlayCircleIcon } from './PlayCircleIcon';
export { PlusToggleIcon } from './PlusToggleIcon';
export { ResizeHandleIcon } from './ResizeHandleIcon';
export { SlackIcon } from './SlackIcon';
export { StarIcon } from './StarIcon';
export { SwitchUserIcon } from './SwitchUserIcon';
export { ThumbIcon } from './ThumbIcon';
export { UndoIcon } from './UndoIcon';
export { UserIcon } from './UserIcon';
export { VideoIcon } from './VideoIcon';
export { WarningCircleIcon } from './WarningCircleIcon';
export { WarningTriangleIcon } from './WarningTriangleIcon';
