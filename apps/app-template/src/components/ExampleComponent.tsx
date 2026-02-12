import { P } from '@bluedot/ui';

export type ExampleComponentProps = {
  name?: string;
};

export const ExampleComponent: React.FC<ExampleComponentProps> = ({ name }) => {
  return (
    <P>Hello {name ?? 'world'}!</P>
  );
};
