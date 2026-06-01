export type StatusPillVariant = 'pending' | 'accepted' | 'pastAccepted' | 'withdrawn' | 'notPlaced';

type StatusPillProps = {
  variant: StatusPillVariant;
};

const VARIANT_LABEL: Record<StatusPillVariant, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  pastAccepted: 'Past - Accepted',
  withdrawn: 'Withdrawn',
  notPlaced: 'Past - Not Placed',
};

const StatusPill = ({ variant }: StatusPillProps) => (
  <span className="text-size-xxs inline-flex min-h-9 items-center justify-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] font-medium text-bluedot-navy">
    {VARIANT_LABEL[variant]}
  </span>
);

export default StatusPill;
