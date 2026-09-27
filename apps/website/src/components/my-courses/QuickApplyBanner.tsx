import { Callout } from '@bluedot/ui';
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
    <Callout
      title="Quick Apply (~2 min)"
      actions={[{ label: 'Quick apply', url: ROUTES.facilitatorApplications.url }]}
      onDismiss={() => dismiss(dismissKey)}
    >
      Thanks for facilitating with BlueDot. If you want to facilitate the same course again, as a return
      facilitator, quick applying only takes 2 min!
    </Callout>
  );
};

export default QuickApplyBanner;
