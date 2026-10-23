import {
  Button, Dialog, DialogTrigger, Keyboard, Popover,
} from 'react-aria-components';
import { ModalTitle } from '@bluedot/ui';

const DEFAULT_SHORTCUTS = [
  { action: 'Navigate sections', keys: ['←', '→', '1-9'] },
  { action: 'Toggle sidebar', keys: ['Ctrl/Cmd', 'B'] },
] as const;

type Shortcut = {
  action: string;
  keys: readonly string[];
};

type KeyboardNavMenuProps = {
  popoverTitle?: string;
  shortcuts?: readonly Shortcut[];
};

const KeyboardNavMenu = ({
  popoverTitle = '',
  shortcuts = DEFAULT_SHORTCUTS,
}: KeyboardNavMenuProps) => {
  return (
    <DialogTrigger>
      <Button
        aria-label="Keyboard shortcuts"
        className="flex cursor-pointer items-center gap-1.5 rounded-md p-2 text-secondary transition-colors hover:bg-tint hover:text-primary aria-expanded:bg-active aria-expanded:text-primary"
      >
        <span aria-hidden="true" className="text-size-sm leading-none">⌘</span>
        Shortcuts
      </Button>
      <Popover placement="top start">
        <Dialog
          aria-label={popoverTitle || 'Keyboard shortcuts'}
          className="w-fit rounded-lg border bg-raised p-4 shadow-sm"
        >
          {popoverTitle && (
            <ModalTitle className="mb-3">
              {popoverTitle}
            </ModalTitle>
          )}
          <ul className="space-y-2">
            {shortcuts.map(({ action, keys }) => (
              <li key={action} className="flex items-center justify-between gap-4">
                <span>{action}</span>
                <div className="flex gap-1">
                  {keys.map((key) => (
                    <Keyboard
                      key={key}
                      className="min-w-8 rounded border border-info-border bg-info-bg px-2 py-1 text-center text-info-fg"
                    >
                      {key}
                    </Keyboard>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};

export default KeyboardNavMenu;
