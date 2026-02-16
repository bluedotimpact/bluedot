import { useState } from 'react';

/**
 * Represents a single FAQ item with question and answer
 */
export type FAQItem = {
  /** Unique identifier for this FAQ item (used for accordion state management) */
  id: string;
  /** The question text */
  question: string;
  /** The answer text or React element */
  answer: React.ReactNode;
};

/**
 * Props for the FAQSection component
 */
export type FAQSectionProps = {
  /** Optional ID for anchor links */
  id?: string;
  /** Section heading displayed at the top */
  title: string;
  /** Array of FAQ items to display */
  items: FAQItem[];
};

const FAQSection = ({ id, title, items }: FAQSectionProps) => {
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const handleToggle = (questionId: string) => {
    setOpenQuestions((prev) => {
      return prev.includes(questionId)
        ? prev.filter((qId) => qId !== questionId) // Remove if already open
        : [...prev, questionId]; // Add if not open
    });
  };

  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-12 min-[680px]:pt-16 min-[680px]:pb-12 min-[1024px]:py-16 min-[1280px]:py-24">
        <div className="max-w-[928px] mx-auto flex flex-col gap-12 md:gap-16">
          <h2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-bluedot-navy text-center">
            {title}
          </h2>

          <div className="flex flex-col gap-6">
            {items.map((item) => {
              const isOpen = openQuestions.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="border border-[rgba(19,19,46,0.1)] bg-white rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`w-full flex items-center gap-8 text-left px-8 cursor-pointer transition-all duration-300 ease ${
                      isOpen ? 'pt-6 pb-2' : 'py-6'
                    } ${!isOpen ? 'hover:bg-gray-50' : ''}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span className="text-[18px] font-semibold leading-[125%] text-bluedot-navy flex-grow">
                      {item.question}
                    </span>
                    <svg
                      width="16"
                      height="17"
                      viewBox="0 0 16 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`flex-shrink-0 transition-transform duration-300 ease ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      <path d="M0 8.5H16M8 0.5L8 16.5" stroke="#001133" strokeWidth="2" />
                    </svg>
                  </button>

                  {/* Answer container with animation */}
                  <div
                    id={`faq-answer-${item.id}`}
                    className={`grid transition-[grid-template-rows] duration-300 ease ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-8 pb-6">
                        <div className="text-[18px] font-normal leading-[160%] text-[#13132E] opacity-80">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
