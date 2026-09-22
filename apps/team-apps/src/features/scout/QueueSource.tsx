export const QueueSource = ({ count, demo }: { count: number; demo: boolean }) => (
  <p className="text-size-xs text-secondary">
    {demo ? 'Example participants.' : `${count} people, from the Talent scouting view in Airtable, in its order. Who appears is decided there, not here.`}
  </p>
);
