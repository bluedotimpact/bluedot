import { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const FAQSection = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

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
    setOpenQuestion(openQuestion === id ? null : id);
  };

  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-spacing-x py-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <div className="max-w-[928px] mx-auto flex flex-col gap-12 md:gap-16">
          <h2 className="text-[28px] md:text-[32px] lg:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-[#13132E] text-center">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-6">
            {faqData.map((item) => {
              const isOpen = openQuestion === item.id;

              return (
                <div
                  key={item.id}
                  className="border border-[rgba(19,19,46,0.1)] bg-white rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`w-full flex items-center justify-between text-left py-6 px-8 transition-colors ${
                      !isOpen ? 'hover:bg-gray-50' : ''
                    }`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                  >
                    <span className="text-[18px] font-semibold leading-[125%] text-[#13132E] pr-4">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <FaTimes className="size-4 text-[#13132E] flex-shrink-0" />
                    ) : (
                      <FaPlus className="size-4 text-[#13132E] flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div id={`faq-answer-${item.id}`} className="px-8 pb-6 -mt-2">
                      <div className="text-[18px] font-normal leading-[160%] text-[#13132E] opacity-80">
                        {item.answer}
                      </div>
                    </div>
                  )}
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
