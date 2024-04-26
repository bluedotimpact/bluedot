export const Page: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="tw-preflight">
      <div className="min-h-screen bg-cream-normal py-16">
        <main className="max-w-3xl border-2 border-stone-300 mx-4 md:mx-auto">
          <div className="m-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
