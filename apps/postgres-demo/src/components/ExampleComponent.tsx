import { NewText } from '@bluedot/ui';

// TODO remove

export type ExampleComponentProps = {
  name?: string,
};

export const ExampleComponent: React.FC<ExampleComponentProps> = ({ name }) => {
  return (
    <NewText.P>Hello {name ?? 'world'}!</NewText.P>
  );
};
