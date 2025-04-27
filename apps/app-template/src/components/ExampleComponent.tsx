import { LegacyText } from '@bluedot/ui';

export type ExampleComponentProps = {
  name?: string,
};

export const ExampleComponent: React.FC<ExampleComponentProps> = ({ name }) => {
  return (
    <LegacyText.P>Hello {name ?? 'world'}!</LegacyText.P>
  );
};
