import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Eyebrow } from '@bluedot/ui';
import type { IconType } from 'react-icons';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBan,
  FaBars,
  FaCalendarDays,
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaCircleCheck,
  FaCircleInfo,
  FaCircleXmark,
  FaClock,
  FaCopy,
  FaEllipsisVertical,
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaLock,
  FaMagnifyingGlass,
  FaPlus,
  FaTriangleExclamation,
  FaUser,
  FaXTwitter,
  FaXmark,
} from 'react-icons/fa6';

import {
  BooksIcon,
  ChunkIcon,
  LaurelWreathIcon,
  ResizeHandleIcon,
} from '.';

// The 27 symbols on the Figma "Icons" page, in grid order, keyed by Figma name.
const FIGMA_SET: [string, IconType][] = [
  ['chevron-down', FaChevronDown],
  ['chevron-right', FaChevronRight],
  ['chevron-up', FaChevronUp],
  ['xmark', FaXmark],
  ['bars', FaBars],
  ['ellipsis-vertical', FaEllipsisVertical],
  ['check', FaCheck],
  ['circle-info', FaCircleInfo],
  ['arrow-right', FaArrowRight],
  ['arrow-left', FaArrowLeft],
  ['lock', FaLock],
  ['plus', FaPlus],
  ['magnifying-glass', FaMagnifyingGlass],
  ['calendar', FaCalendarDays],
  ['circle-check', FaCircleCheck],
  ['chevron-left', FaChevronLeft],
  ['warning', FaTriangleExclamation],
  ['copy', FaCopy],
  ['ban', FaBan],
  ['clock', FaClock],
  ['circle-xmark', FaCircleXmark],
  ['linkedin', FaLinkedin],
  ['x-twitter', FaXTwitter],
  ['facebook', FaFacebook],
  ['envelope', FaEnvelope],
  ['github', FaGithub],
  ['user', FaUser],
];

type IconCellProps = {
  name: string;
  children: ReactNode;
  note?: string;
};

const IconCell = ({ name, children, note }: IconCellProps) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-default bg-raised p-4 text-center">
    <div className="text-primary flex min-h-12 items-center justify-center">{children}</div>
    <div className="text-size-xs font-medium text-primary">{name}</div>
    {note && <div className="text-size-xxs text-secondary">{note}</div>}
  </div>
);

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{children}</div>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <Eyebrow className="text-secondary">{title}</Eyebrow>
    {children}
  </section>
);

const Gallery = () => (
  <div className="flex min-h-screen flex-col gap-8 bg-canvas p-6">
    <Section title="Figma set (react-icons/fa6)">
      <Grid>
        {FIGMA_SET.map(([name, Glyph]) => (
          <IconCell key={name} name={name} note={`Fa${Glyph.name.replace(/^Fa/, '')}`}>
            <Glyph className="size-6" />
          </IconCell>
        ))}
      </Grid>
    </Section>

    <Section title="Sizing: 1em default, size-* to override (FaCheck)">
      <Grid>
        <IconCell name="1em in text-size-xs">
          <span className="text-size-xs"><FaCheck /></span>
        </IconCell>
        <IconCell name="1em in text-size-lg">
          <span className="text-size-lg"><FaCheck /></span>
        </IconCell>
        <IconCell name="size-3">
          <FaCheck className="size-3" />
        </IconCell>
        <IconCell name="size-4">
          <FaCheck className="size-4" />
        </IconCell>
        <IconCell name="size-6">
          <FaCheck className="size-6" />
        </IconCell>
        <IconCell name="size-8">
          <FaCheck className="size-8" />
        </IconCell>
      </Grid>
    </Section>

    <Section title="Bespoke artwork (apps/website/src/components/icons)">
      <Grid>
        <IconCell name="BooksIcon" note="80px illustration">
          <BooksIcon aria-hidden="true" />
        </IconCell>
        <IconCell name="LaurelWreathIcon" note="255×174 illustration">
          <LaurelWreathIcon aria-hidden="true" className="w-full h-auto" />
        </IconCell>
        <IconCell name="ChunkIcon" note="isActive">
          <ChunkIcon isActive aria-hidden="true" />
        </IconCell>
        <IconCell name="ChunkIcon" note="inactive">
          <ChunkIcon aria-hidden="true" />
        </IconCell>
        <IconCell name="ResizeHandleIcon">
          <ResizeHandleIcon aria-hidden="true" />
        </IconCell>
      </Grid>
    </Section>
  </div>
);

const meta = {
  title: 'website/icons/Gallery',
  component: Gallery,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {};
