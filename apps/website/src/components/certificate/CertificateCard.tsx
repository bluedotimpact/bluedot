import type React from 'react';
import Image from 'next/image';
import { COURSE_CONFIG } from '../../lib/constants';

type CertificateCardProps = {
  courseName: string;
  courseSlug: string;
  recipientName: string;
  description: string;
  issuedDate: string;
  certificateId: string;
};

const DEFAULT_BADGE_PATH = '/images/certificates/certificate-fallback-image.png';
const DISPLAY_FONT_STYLE = { fontFeatureSettings: '\'ss04\' 1' };

const generatePatternPositions = () => {
  const positions: { x: number; y: number }[] = [];
  const hSpacing = 80;
  const vSpacing = 56;
  const offsetAmount = 40;

  for (let row = 0; row < 8; row++) {
    const isOffsetRow = row % 2 === 1;
    const startX = isOffsetRow ? offsetAmount : 0;

    for (let col = 0; col < 16; col++) {
      positions.push({
        x: startX + col * hSpacing,
        y: row * vSpacing,
      });
    }
  }

  return positions;
};

const PATTERN_POSITIONS = generatePatternPositions();

export const CertificateCard: React.FC<CertificateCardProps> = ({
  courseName,
  courseSlug,
  recipientName,
  description,
  issuedDate,
  certificateId,
}) => {
  const isKnownCourse = courseSlug in COURSE_CONFIG;
  const badgePath = isKnownCourse
    ? `/images/certificates/${courseSlug}.png`
    : DEFAULT_BADGE_PATH;
  const iconPath = isKnownCourse
    ? `/images/certificates/icons/${courseSlug}-icon.svg`
    : null;

  return (
    <div className="w-full max-w-[800px] bg-white rounded-lg border border-slate-200 overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.06)]">
      <div className="relative">
        {iconPath && (
          <div className="absolute -left-[338px] md:-left-[115px] top-0 w-[1043px] h-[450px] overflow-hidden">
            <div className="relative w-[1248px] h-[450px]">
              {/* Tailwind doesn't support CSS masks with dynamic URLs - using inline styles */}
              {PATTERN_POSITIONS.map((pos) => (
                <div
                  key={`${pos.x}-${pos.y}`}
                  className="absolute size-12 opacity-5"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    backgroundColor: '#13132E',
                    WebkitMaskImage: `url(${iconPath})`,
                    maskImage: `url(${iconPath})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                />
              ))}
            </div>
            {/* Tailwind doesn't support multi-stop gradients with specific opacity values */}
            <div
              className="absolute left-0 top-0 w-full h-[450px]"
              style={{
                background: `linear-gradient(to bottom,
                  transparent 0%,
                  transparent 22%,
                  rgba(255,255,255,0.2) 35%,
                  rgba(255,255,255,0.4) 48%,
                  rgba(255,255,255,0.6) 60%,
                  rgba(255,255,255,0.8) 73%,
                  rgba(255,255,255,0.95) 85%,
                  white 100%)`,
              }}
            />
          </div>
        )}

        <div className="relative flex justify-center pt-12">
          <div className="w-[252px] h-[200px] md:w-[300px] md:h-[238px]">
            <Image
              src={badgePath}
              alt={`${courseName} Certificate Badge`}
              width={300}
              height={238}
              className="size-full object-contain"
              priority
            />
          </div>
        </div>

        <div className="relative flex flex-col items-center px-5 md:px-16 pb-0">
          <p className="mt-16 text-size-xs md:text-size-sm font-medium uppercase tracking-[0.02em] leading-[1.6] text-[#62748E] text-center">
            Professional certification
          </p>

          <h1
            className="mt-1 text-[40px] md:text-[56px] font-semibold leading-tight tracking-[-0.5px] text-[#13132E] text-center font-display"
            style={DISPLAY_FONT_STYLE}
          >
            {courseName}
          </h1>

          <div className="mt-12">
            <p className="text-size-sm font-medium uppercase tracking-[0.02em] leading-[1.6] text-[#62748E] text-center">
              Awarded to
            </p>
            <p className="mt-1 text-2xl font-semibold leading-tight text-[#13132E] text-center font-display">
              {recipientName}
            </p>
          </div>

          <div className="mt-12 max-w-[313px] md:max-w-[672px]">
            <p
              className="text-[15px] md:text-base leading-[1.6] md:leading-[26px] tracking-[-0.3125px] text-[#62748E] text-center [&_strong]:font-semibold [&_strong]:text-[#13132E]"
              style={DISPLAY_FONT_STYLE}

              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        </div>
      </div>

      <div className="mt-16 mx-5 md:mx-16 border-t border-slate-200 pt-[25px] pb-6">
        <div className="flex justify-between items-end">
          <div className="w-[156px] md:w-[240px]">
            <p className="text-size-xs font-medium uppercase tracking-[0.02em] leading-[1.6] text-[#62748E]">
              Issued
            </p>
            <p
              className="mt-1 text-[15px] md:text-base font-medium leading-[26px] tracking-[-0.3125px] text-[#13132E]"
              style={DISPLAY_FONT_STYLE}
            >
              {issuedDate}
            </p>
          </div>

          <div className="hidden md:block">
            <Image
              src="/images/certificates/bluedot-impact-logo.png"
              alt="BlueDot Impact"
              width={152}
              height={32}
              className="object-contain"
            />
          </div>

          <div className="w-[156px] md:w-[240px] text-right">
            <p className="text-size-xs font-medium uppercase tracking-[0.02em] leading-[1.6] text-[#62748E]">
              Certificate ID
            </p>
            <p
              className="mt-1 text-[15px] md:text-base font-medium leading-[26px] tracking-[-0.3125px] text-[#13132E]"
              style={DISPLAY_FONT_STYLE}
            >
              {certificateId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
