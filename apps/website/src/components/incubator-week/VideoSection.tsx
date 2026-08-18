import TrackRecordSection from './TrackRecordSection';

const VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/C3yDinK0ic0?rel=0';
const VIDEO_TITLE = 'Can You Build an AI Safety Startup in Five Days?';

const VideoSection = () => {
  return (
    <section className="section section-body incubator-week-video-section">
      <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-12">
        <div className="order-2 lg:order-1">
          <TrackRecordSection />
        </div>

        <div className="order-1 overflow-hidden rounded-xl bg-bluedot-navy p-1.5 shadow-xl bd-md:p-2 lg:order-2">
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
