import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'ui/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        <div>
          <h3 className="text-lg font-bold mb-4">Text Input</h3>
          <Input type="text" label="This is the label" placeholder="This is the placeholder" />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Radio Button</h3>
          <form className="flex flex-col gap-4">
            <Input type="radio" value="This is the first value" name="radio-group" />
            <Input type="radio" value="This is the second value" name="radio-group" />
          </form>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4">Checkbox</h3>
          <form className="flex flex-col gap-4">
            <Input type="checkbox" value="This is the first value" name="checkbox-group" />
            <Input type="checkbox" value="This is the second value" name="checkbox-group" />
          </form>
        </div>
      </div>
    ),
  ],
  args: {},
};
