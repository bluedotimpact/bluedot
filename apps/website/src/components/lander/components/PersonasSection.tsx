import { useState, ReactNode } from 'react';
import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { IconType } from 'react-icons';

export type Persona = {
  icon: IconType;
  title: string;
  summary?: string;
  description: ReactNode;
  valueProposition: ReactNode;
};

export type PersonasSectionProps = {
  id?: string;
  title?: string;
  personas: Persona[];
  accentColor?: string;
  defaultExpandedIndex?: number;
  cta?: {
    text: string;
    url: string;
  };
};

const PersonasSection = ({
  id,
  title = 'Who this course is for',
  personas,
  accentColor = '#1F588A',
  defaultExpandedIndex = 0,
  cta,
}: PersonasSectionProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(defaultExpandedIndex);

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? -1 : index);
  };

  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy text-center mb-12 md:mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="max-w-[800px] mx-auto flex flex-col gap-4">
          {personas.map((persona, index) => {
            const IconComponent = persona.icon;
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={persona.title}
                className="bg-white rounded-xl border border-bluedot-navy/10 overflow-hidden"
              >
                {/* Header - always visible, clickable */}
                <button
                  type="button"
                  onClick={() => handleToggle(index)}
                  className="w-full px-6 py-5 min-[680px]:px-8 min-[680px]:py-6 flex items-center gap-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
                  style={isExpanded ? { backgroundColor: accentColor } : {}}
                  aria-expanded={isExpanded}
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={isExpanded
                      ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                      : { backgroundColor: `${accentColor}15` }}
                  >
                    <IconComponent
                      size={24}
                      style={{ color: isExpanded ? 'white' : accentColor }}
                    />
                  </div>
                  <span
                    className="text-[18px] min-[680px]:text-[20px] font-semibold leading-[130%] flex-grow text-left"
                    style={{ color: isExpanded ? 'white' : 'var(--bluedot-navy)' }}
                  >
                    {persona.title}
                  </span>
                  <svg
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`}
                  >
                    <path
                      d="M0 8.5H16M8 0.5L8 16.5"
                      stroke={isExpanded ? 'white' : 'var(--bluedot-navy)'}
                      strokeWidth="2"
                    />
                  </svg>
                </button>

                {/* Content - expandable */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-6 min-[680px]:p-8 flex flex-col gap-4">
                      {/* Summary */}
                      {persona.summary && (
                        <P className="text-[17px] min-[680px]:text-[18px] leading-normal text-bluedot-navy font-semibold">
                          {persona.summary}
                        </P>
                      )}

                      {/* Description */}
                      <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-bluedot-navy/70">
                        {persona.description}
                      </P>

                      {/* What this looks like */}
                      <div className="pt-4 border-t border-bluedot-navy/10">
                        <p className="text-[11px] min-[680px]:text-[12px] font-semibold uppercase tracking-[0.08em] text-bluedot-navy/40 mb-2">
                          What this looks like
                        </p>
                        <P className="text-[15px] min-[680px]:text-[16px] leading-[1.6] text-bluedot-navy/80">
                          {persona.valueProposition}
                        </P>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cta && (
          <div className="flex justify-center mt-10 md:mt-12">
            <CTALinkOrButton
              url={cta.url}
              variant="primary"
              className="!px-8 !py-3 !text-base"
            >
              {cta.text}
            </CTALinkOrButton>
          </div>
        )}
      </div>
    </section>
  );
};

export default PersonasSection;
