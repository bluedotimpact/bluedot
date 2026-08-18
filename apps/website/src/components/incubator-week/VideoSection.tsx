import { Eyebrow, H2, P } from '@bluedot/ui';

const VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/C3yDinK0ic0?rel=0';
const VIDEO_TITLE = 'Can You Build an AI Safety Startup in Five Days?';

const VideoSection = () => {
  return (
    <section className="section section-body incubator-week-video-section">
      <div className="w-full flex flex-col gap-6">
        <div className="max-w-prose flex flex-col gap-3">
          <Eyebrow className="text-bluedot-navy/80">Inside the week</Eyebrow>
          <H2>Can you build an AI safety startup in five days?</H2>
          <P className="text-bluedot-navy/80">
            Watch the latest cohort find out.
          </P>
        </div>

        <div className="overflow-hidden rounded-xl bg-bluedot-navy p-1.5 shadow-xl bd-md:p-2">
          <iframe
            src={VIDEO_EMBED_URL}
            title={VIDEO_TITLE}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full rounded-lg border-0"
          />
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
