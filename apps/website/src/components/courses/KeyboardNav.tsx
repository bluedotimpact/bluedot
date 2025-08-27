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
      <Button className="transition-color flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gray-200 p-2 duration-200 hover:bg-gray-300">
        <FiCommand className="size-4" />
        Shortcuts
      </Button>
      <Popover placement="top start">
        <Dialog className="min-w-[270px] rounded-lg border-[0.5px] border-gray-300 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <h3 className="mb-1 font-semibold">Inside courses</h3>
            {shortcuts.map(({ action, keys }) => (
              <div key={action} className="flex items-center justify-between">
                <span>{action}</span>
                {keys.map((key) => (
                  <Keyboard
                    key={key}
                    className="flex min-w-[34px] items-center justify-center rounded border border-blue-300 bg-blue-100 px-2 py-1 text-blue-700"
                  >
                    {key}
                  </Keyboard>
                ))}
              </div>
            ))}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
};

export default KeyboardNav;
