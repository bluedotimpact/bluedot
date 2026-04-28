import Link from 'next/link';

const FacilitatorFeedbackHeader: React.FC<{ roundName?: string }> = ({ roundName }) => (
  <header className="bg-white border-b border-gray-300 flex items-center gap-4 px-5 sm:pl-10 sm:pr-5 py-5">
    <Link href="/" className="shrink-0">
      <img src="/images/logo/BlueDot_Impact_Logo.svg" alt="BlueDot Impact" className="h-5" />
    </Link>
    <div className="h-[18px] w-px bg-gray-300 shrink-0" aria-hidden />
    <div className="flex items-center gap-2 text-size-xs min-w-0">
      <span className="font-semibold text-bluedot-navy shrink-0">Course Feedback</span>
      {roundName && (
        <>
          <span className="text-gray-400 shrink-0" aria-hidden>·</span>
          <span className="font-medium text-bluedot-navy/60 truncate">{roundName}</span>
        </>
      )}
    </div>
  </header>
);

export default FacilitatorFeedbackHeader;
