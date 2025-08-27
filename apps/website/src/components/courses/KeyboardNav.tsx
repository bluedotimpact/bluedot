import {
  Button, Dialog, DialogTrigger, Keyboard, Popover,
} from 'react-aria-components';
import { FiCommand } from 'react-icons/fi';

const shortcuts = [
  { action: 'Go to chunk or unit 1-9', keys: ['1-9'] },
  { action: 'Next chunk or unit', keys: ['→'] },
  { action: 'Previous chunk or unit', keys: ['←'] },
] as const;

const KeyboardNav = () => {
  return (
    <DialogTrigger>
      <Button className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gray-200 p-2 hover:bg-gray-300">
        <FiCommand className="size-4" />
        Shortcuts
      </Button>
      <Popover placement="top">
        <Dialog>
          <div className="flex-col">
            <h3 className="font-semibold">Inside courses</h3>
            {shortcuts.map(({ action, keys }) => (
              <div key={action} className="flex items-center justify-between">
                <span>{action}</span>
                <div className="flex gap-1">
                  {keys.map((key) => (
                    <Keyboard key={key} className="rounded border bg-blue-100 px-2 py-1">
                      {key}
                    </Keyboard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};

export default KeyboardNav;
