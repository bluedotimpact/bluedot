import {
  Button, Dialog, DialogTrigger, Keyboard, Popover,
} from 'react-aria-components';
import { FiCommand } from 'react-icons/fi';

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
        className="flex cursor-pointer items-center gap-1.5 rounded-md p-2 text-sm/4 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 aria-expanded:bg-gray-200 aria-expanded:text-gray-700"
      >
        <FiCommand className="size-4" />
        Shortcuts
      </Button>
      <Popover placement="top start">
        <Dialog
          aria-label={popoverTitle || 'Keyboard shortcuts'}
          className="w-fit rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
        >
          {popoverTitle && (
            <h3 className="mb-3 font-semibold">
              {popoverTitle}
            </h3>
          )}
          <ul className="space-y-2">
            {shortcuts.map(({ action, keys }) => (
              <li key={action} className="flex items-center justify-between gap-4">
                <span>{action}</span>
                <div className="flex gap-1">
                  {keys.map((key) => (
                    <Keyboard
                      key={key}
                      className="min-w-8 rounded border border-blue-700 bg-blue-100 px-2 py-1 text-center text-blue-800"
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
