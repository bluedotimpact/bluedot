import { useState } from 'react';

const FAQSection = () => {
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const faqData = [
    {
      id: 'funding',
      question: 'Can I just apply for funding?',
      answer: 'Funding is only available for graduates of the course.',
    },
    {
      id: 'bluedot',
      question: 'Who is BlueDot Impact?',
      answer: (
        <>
          We're a London-based startup. Since 2022, we've trained 5,000 people, with ~1,000 now working on making AI go well.
          <br /><br />
          Our courses are the main entry point into the AI safety field.
          <br /><br />
          We're an intense 4-person team. We've raised $35M in total, including $25M in 2025.
        </>
      ),
    },
  ];

  const handleToggle = (id: string) => {
    setOpenQuestions((prev) => {
      return prev.includes(id)
        ? prev.filter((questionId) => questionId !== id) // Remove if already open
        : [...prev, id]; // Add if not open
    });
  };

  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-12 min-[680px]:py-16 lg:pt-24 lg:pb-20">
        <div className="max-w-[928px] mx-auto flex flex-col gap-12 md:gap-16">
          <h2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-[#13132E] text-center">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-6">
            {faqData.map((item) => {
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
                    <span className="text-[18px] font-semibold leading-[125%] text-[#13132E] flex-grow">
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
