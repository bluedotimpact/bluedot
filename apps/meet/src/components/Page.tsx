import { Section } from '@bluedot/ui';

export const Page: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <main className="tw-preflight bluedot-base bg-bluedot-darker">
      <div className="px-8 py-12">
        <Section className="border-b-0 py-16 px-12 bg-cream-normal rounded-lg max-w-3xl">
          {children}
        </Section>
      </div>
    </main>
  );
};
