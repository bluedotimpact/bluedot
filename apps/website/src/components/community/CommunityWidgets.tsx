import { BugReportModal, useAuthStore } from '@bluedot/ui';
import { CircleWidget } from './CircleWidget';

export const CommunityWidgets = () => {
  const auth = useAuthStore((s) => s.auth);

  return (
    <div className="fixed bottom-4 right-4 flex flex-row-reverse items-end gap-4 z-10">
      <CircleWidget />
      {auth && (
        <div className="pr-20 pb-3">
          <BugReportModal
            onSubmit={async (message) => {
              await fetch('/api/bug-report', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({ message }),
              });
            }}
          />
        </div>
      )}
    </div>
  );
};
