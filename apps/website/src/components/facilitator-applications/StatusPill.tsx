export type StatusPillVariant = 'pending' | 'accepted' | 'pastAccepted' | 'withdrawn' | 'notPlaced';

type StatusPillProps = {
  variant: StatusPillVariant;
};

const VARIANT_LABEL: Record<StatusPillVariant, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  withdrawn: 'Withdrawn',
  notPlaced: 'Not placed',
};

const VARIANT_CLASS: Record<StatusPillVariant, string> = {
  pending: 'bg-bluedot-lighter/30 text-bluedot-navy',
  accepted: 'bg-bluedot-lighter/30 text-bluedot-navy',
  withdrawn: 'bg-black/[0.04] text-bluedot-navy/60',
  notPlaced: 'bg-black/[0.04] text-bluedot-navy/60',
};

const StatusPill = ({ variant }: StatusPillProps) => (
  <span
    className={`text-size-xxs inline-flex min-h-9 items-center justify-center gap-1 rounded-full px-3 py-[7px] font-medium ${VARIANT_CLASS[variant]}`}
  >
    {VARIANT_LABEL[variant]}
  </span>
);

export default StatusPill;
