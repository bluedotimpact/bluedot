import {
  CardShell, cn, H2, P,
} from '@bluedot/ui';
import clsx from 'clsx';
import { useState } from 'react';
import { PlusToggleIcon } from '../../icons';

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
  /** Plain text version of answer for JSON-LD structured data. Required when answer is JSX. */
  answerText?: string;
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
  background?: 'white' | 'canvas';
  variant?: 'cards' | 'plain';
};

const FAQSection = ({ id, title, items, background = 'white', variant = 'cards' }: FAQSectionProps) => {
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const getAnswerText = (item: FAQItem): string => {
    if (item.answerText !== undefined) return item.answerText;
    return typeof item.answer === 'string' ? item.answer : '';
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: getAnswerText(item),
      },
    })),
  };

  const handleToggle = (questionId: string) => {
    setOpenQuestions((prev) => {
      return prev.includes(questionId)
        ? prev.filter((qId) => qId !== questionId) // Remove if already open
        : [...prev, questionId]; // Add if not open
    });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/<\/script>/gi, '<\\/script>')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029'),
        }}
      />
      {variant === 'plain' ? (
        <section id={id} className="section-base">
          <div className="py-10 bd-md:py-12">
            <h2 className="mb-7 text-size-lg font-medium tracking-tight">{title}</h2>
            <div className="divide-y divide-bluedot-navy/15 border-t border-bluedot-navy/15">
              {items.map((item) => (
                <details key={item.id} className="group">
                  <summary className="flex min-h-14 py-4 cursor-pointer list-none items-center justify-between gap-6 text-size-sm font-medium leading-relaxed [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <PlusToggleIcon className="shrink-0 text-secondary transition-transform group-open:rotate-45" />
                  </summary>
                  <div className="pb-5 max-w-[800px] text-size-sm leading-relaxed text-secondary">{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section id={id} className={clsx('w-full', background === 'canvas' ? 'bg-canvas' : 'bg-white')}>
          <div className="max-w-max-width bd-md:px-8 lg:px-spacing-x bd-md:pt-16 bd-md:pb-12 mx-auto px-5 py-12 lg:py-16 xl:py-24">
            <div className="mx-auto flex max-w-[928px] flex-col gap-12 md:gap-16">
              <H2 className="text-center">
                {title}
              </H2>

              <div className="flex flex-col gap-6">
                {items.map((item) => {
                  const isOpen = openQuestions.includes(item.id);

                  return (
                    <CardShell key={item.id} className="overflow-hidden p-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        className={`ease flex w-full cursor-pointer items-center gap-8 px-8 text-left transition-all duration-300 ${
                          isOpen ? 'pt-6 pb-4' : 'py-6'
                        } ${!isOpen ? 'hover:bg-gray-50' : ''}`}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${item.id}`}
                      >
                        <span className="text-bluedot-navy flex-grow text-size-md leading-snug font-semibold">
                          {item.question}
                        </span>
                        <PlusToggleIcon
                          className={cn(
                            'ease flex-shrink-0 text-bluedot-darker transition-transform duration-300',
                            isOpen && 'rotate-45',
                          )}
                        />
                      </button>

                      {/* Answer container with animation */}
                      <div
                        id={`faq-answer-${item.id}`}
                        className={`ease grid transition-[grid-template-rows] duration-300 ${
                          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-8 pb-6">
                            <P className="text-bluedot-navy/80 text-size-md">{item.answer}</P>
                          </div>
                        </div>
                      </div>
                    </CardShell>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default FAQSection;
