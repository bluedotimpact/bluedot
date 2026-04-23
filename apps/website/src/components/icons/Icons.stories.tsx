import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

import { ArrowDownIcon } from './ArrowDownIcon';
import { ArrowRightIcon } from './ArrowRightIcon';
import { CheckIcon } from './CheckIcon';
import { CheckmarkIcon } from './CheckmarkIcon';
import { ChevronRightIcon } from './ChevronRightIcon';
import { ChunkIcon } from './ChunkIcon';
import { CircledCheckmarkIcon } from './CircledCheckmarkIcon';
import { ClockIcon } from './ClockIcon';
import { ClockUserIcon } from './ClockUserIcon';
import { DocumentIcon } from './DocumentIcon';
import { ErrorIcon } from './ErrorIcon';
import { ExternalLinkIcon } from './ExternalLinkIcon';
import { InfoIcon } from './InfoIcon';
import { MoonStarsIcon } from './MoonStarsIcon';
import { MusicNoteIcon } from './MusicNoteIcon';
import { PlayCircleIcon } from './PlayCircleIcon';
import { PlusToggleIcon } from './PlusToggleIcon';
import { ResizeHandleIcon } from './ResizeHandleIcon';
import { SlackIcon } from './SlackIcon';
import { StarIcon } from './StarIcon';
import { SwitchUserIcon } from './SwitchUserIcon';
import { ThumbIcon } from './ThumbIcon';
import { UndoIcon } from './UndoIcon';
import { UserIcon } from './UserIcon';
import { VideoIcon } from './VideoIcon';
import { WarningCircleIcon } from './WarningCircleIcon';
import { WarningTriangleIcon } from './WarningTriangleIcon';

type IconCellProps = {
  name: string;
  children: ReactNode;
  note?: string;
};

const IconCell = ({ name, children, note }: IconCellProps) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center">
    <div className="flex min-h-[48px] items-center justify-center text-bluedot-navy">
      {children}
    </div>
    <div className="text-size-xs font-medium text-gray-800">{name}</div>
    {note && <div className="text-[10px] text-gray-500">{note}</div>}
  </div>
);

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    {children}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-size-sm font-semibold uppercase tracking-wider text-gray-600">{title}</h2>
    {children}
  </section>
);

const Gallery = () => (
  <div className="flex flex-col gap-8 p-6 bg-gray-50 min-h-screen">
    <Section title="Single-color icons">
      <Grid>
        <IconCell name="ArrowDownIcon"><ArrowDownIcon /></IconCell>
        <IconCell name="ArrowRightIcon"><ArrowRightIcon /></IconCell>
        <IconCell name="CheckIcon"><CheckIcon size={24} /></IconCell>
        <IconCell name="ChevronRightIcon"><ChevronRightIcon /></IconCell>
        <IconCell name="CircledCheckmarkIcon"><CircledCheckmarkIcon size={24} /></IconCell>
        <IconCell name="ClockIcon"><ClockIcon /></IconCell>
        <IconCell name="ClockUserIcon"><ClockUserIcon /></IconCell>
        <IconCell name="DocumentIcon"><DocumentIcon size={20} /></IconCell>
        <IconCell name="ErrorIcon"><ErrorIcon size={24} /></IconCell>
        <IconCell name="ExternalLinkIcon"><ExternalLinkIcon size={20} /></IconCell>
        <IconCell name="MoonStarsIcon"><MoonStarsIcon /></IconCell>
        <IconCell name="MusicNoteIcon"><MusicNoteIcon /></IconCell>
        <IconCell name="PlayCircleIcon"><PlayCircleIcon /></IconCell>
        <IconCell name="PlusToggleIcon"><PlusToggleIcon className="text-bluedot-navy" /></IconCell>
        <IconCell name="ResizeHandleIcon"><ResizeHandleIcon /></IconCell>
        <IconCell name="SlackIcon"><SlackIcon /></IconCell>
        <IconCell name="SwitchUserIcon"><SwitchUserIcon /></IconCell>
        <IconCell name="UndoIcon"><UndoIcon /></IconCell>
        <IconCell name="UserIcon"><UserIcon size={24} /></IconCell>
        <IconCell name="VideoIcon"><VideoIcon size={24} /></IconCell>
        <IconCell name="WarningCircleIcon"><WarningCircleIcon /></IconCell>
        <IconCell name="WarningTriangleIcon"><WarningTriangleIcon /></IconCell>
      </Grid>
    </Section>

    <Section title="Stateful / multi-variant icons">
      <Grid>
        <IconCell name="ChunkIcon" note="isActive">
          <ChunkIcon isActive />
        </IconCell>
        <IconCell name="ChunkIcon" note="inactive">
          <ChunkIcon />
        </IconCell>
        <IconCell name="CheckmarkIcon" note="completed">
          <div className="bg-bluedot-normal rounded p-1">
            <CheckmarkIcon variant="completed" />
          </div>
        </IconCell>
        <IconCell name="CheckmarkIcon" note="hover">
          <CheckmarkIcon variant="hover" />
        </IconCell>
        <IconCell name="StarIcon" note="filled">
          <StarIcon filled size={24} />
        </IconCell>
        <IconCell name="StarIcon" note="empty">
          <StarIcon size={24} />
        </IconCell>
        <IconCell name="ThumbIcon" note="filled=true">
          <ThumbIcon filled />
        </IconCell>
        <IconCell name="ThumbIcon" note="filled=false">
          <ThumbIcon filled={false} />
        </IconCell>
      </Grid>
    </Section>

    <Section title="Dual-tone icons">
      <Grid>
        <IconCell name="InfoIcon" note="default (blue/white)">
          <InfoIcon />
        </IconCell>
        <IconCell name="InfoIcon" note="red/white">
          <InfoIcon bgFill="#DC0000" fgFill="white" />
        </IconCell>
      </Grid>
    </Section>

    <Section title="Size sweep (ChevronRightIcon)">
      <Grid>
        <IconCell name="size=12"><ChevronRightIcon size={12} /></IconCell>
        <IconCell name="size=16"><ChevronRightIcon size={16} /></IconCell>
        <IconCell name="size=20"><ChevronRightIcon /></IconCell>
        <IconCell name="size=32"><ChevronRightIcon size={32} /></IconCell>
        <IconCell name="size=48"><ChevronRightIcon size={48} /></IconCell>
        <IconCell name="size='2em'"><ChevronRightIcon size="2em" /></IconCell>
      </Grid>
    </Section>

    <Section title="Color via text-* class (ClockIcon)">
      <Grid>
        <IconCell name="text-bluedot-navy"><ClockIcon className="text-bluedot-navy" /></IconCell>
        <IconCell name="text-bluedot-normal"><ClockIcon className="text-bluedot-normal" /></IconCell>
        <IconCell name="text-red-500"><ClockIcon className="text-red-500" /></IconCell>
        <IconCell name="text-green-600"><ClockIcon className="text-green-600" /></IconCell>
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
