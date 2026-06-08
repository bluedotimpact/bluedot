import { CTALinkOrButton } from '@bluedot/ui';
import { FaRegFileLines } from 'react-icons/fa6';
import { ROUTES } from '../../lib/routes';
import { useQuickApplyBannerStore } from '../../stores/quickApplyBanner';
import { trpc } from '../../utils/trpc';

export const QuickApplyBanner = () => {
  const { data } = trpc.facilitatorApplications.eligibleRounds.useQuery();

  // Key the dismissal by the set of currently-eligible rounds, so hiding sticks for this
  // opportunity but the banner returns when the facilitator is wrapping up a new course.
  const eligibleRoundIds = (data ?? []).flatMap((course) => course.rounds.map((round) => round.id)).sort();
  const dismissKey = eligibleRoundIds.join('|');

  const isDismissed = useQuickApplyBannerStore((s) => Boolean(s.dismissedKeys[dismissKey]));
  const dismiss = useQuickApplyBannerStore((s) => s.dismiss);

  if (eligibleRoundIds.length === 0 || isDismissed) return null;

  return (
    <div className="border-bluedot-normal/10 bg-bluedot-normal/5 rounded-md border border-solid p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 text-bluedot-normal">
          <div className="flex items-center gap-2">
            <FaRegFileLines className="size-4 shrink-0" />
            <p className="text-size-sm font-bold">Quick Apply (~2 min)</p>
          </div>
          <p className="text-size-xs mt-1 text-pretty">
            Thanks for facilitating with BlueDot. If you want to facilitate the same course again, as a return
            facilitator, quick applying only takes 2 min!
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <CTALinkOrButton variant="secondary" size="small" onClick={() => dismiss(dismissKey)}>
            Hide
          </CTALinkOrButton>
          <CTALinkOrButton variant="primary" size="small" url={ROUTES.facilitatorApplications.url}>
            Quick apply
          </CTALinkOrButton>
        </div>
      </div>
    </div>
  );
};

export default QuickApplyBanner;
