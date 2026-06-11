import { P } from '@bluedot/ui';

const CapacityNoticeSection = () => {
  return (
    <div className="career-transition-grant-capacity-notice w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y flex justify-center">
      <div className="max-w-prose rounded-lg bg-bluedot-lighter border-l-4 border-bluedot-normal p-6 flex flex-col gap-2">
        <h4 className="text-size-md font-semibold text-bluedot-navy">
          A quick note on timing
        </h4>
        <P className="text-size-sm leading-[1.65] text-bluedot-navy/80">
          Our team is relocating from the UK to San Francisco over the next few
          weeks. Applications are open as usual, but reviews will be slower than
          normal until early July. Thanks for your patience!
        </P>
      </div>
    </div>
  );
};

export default CapacityNoticeSection;
