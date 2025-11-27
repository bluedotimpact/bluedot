import React from 'react';
import { getCioAnalytics } from '../analytics/CustomerioAnalytics';

const NewsletterBanner = () => {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const submittedEmail = email;

    try {
      const [cio] = await getCioAnalytics();
      cio.identify(submittedEmail, {
        email: submittedEmail,
      });

      setEmail('');
      setSuccessMessage('Successfully subscribed!');
      setIsSubmitting(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setSuccessMessage('');
        }
      }, 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to subscribe:', error);
      setErrorMessage('Something went wrong. Please try again later.');
      setIsSubmitting(false);

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setErrorMessage('');
        }
      }, 5000);
    }
  };

  return (
    <div className="relative w-full min-[680px]:border min-[680px]:border-[rgba(0,0,0,0.08)] min-[680px]:rounded-xl overflow-hidden">
      {/* Background Layers - Non-interactive */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {/* Background Image - Flipped Horizontally */}
        <div
          className="absolute inset-0 min-[680px]:rounded-xl -scale-x-100 bg-cover"
          style={{
            backgroundImage: 'url(\'/images/homepage/hero.jpg\')',
            backgroundPosition: '50% 60%',
          }}
        />

        {/* Overlay */}
        <div
          className="absolute inset-0 min-[680px]:rounded-xl"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 5.172%, rgba(0,0,0,0.6) 100%)',
            mixBlendMode: 'overlay', // Tailwind doesn't support mix-blend-mode
          }}
        />

        {/* Noise Texture */}
        <div
          className="absolute inset-0 min-[680px]:rounded-xl opacity-50"
          style={{
            backgroundImage: 'url(/images/homepage/noise.svg)',
            backgroundSize: '464.64px 736.56px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'top left',
            mixBlendMode: 'soft-light', // Tailwind doesn't support mix-blend-mode
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-[680px]:items-start gap-8 pt-8 px-6 pb-0 min-[680px]:py-10 min-[680px]:px-8 lg:py-16 lg:px-12">
        <div className="flex flex-col gap-4 w-full">
          <span className="text-[10px] leading-[14px] tracking-[0.5px] uppercase text-white opacity-70 font-medium">
            Newsletter
          </span>

          <h3 className="text-2xl leading-tight text-white max-w-[512px]">
            Subscribe to get AI safety news and course updates delivered directly to your inbox
          </h3>
        </div>

        <div className="relative w-full lg:w-[480px]">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={`flex flex-col lg:flex-row gap-3 w-full transition-opacity duration-300 ${
              successMessage || errorMessage ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-11 px-4 bg-white rounded-md text-size-sm leading-[18.2px] tracking-[0.42px] text-[#13132e] placeholder:text-[#13132e] placeholder:opacity-60 border border-[rgba(0,0,0,0.1)] focus:outline-none focus:border-transparent focus:border-[3px] transition-all"
              style={{
                // Gradient border on focus - Tailwind doesn't support gradient borders with double background layers
                backgroundOrigin: 'padding-box, border-box',
                backgroundClip: 'padding-box, border-box',
              }}
              onFocus={(e) => {
                e.target.style.backgroundImage = 'linear-gradient(white, white), linear-gradient(90deg, #ff9c5a 0%, #ff5aa0 50%, #a05aff 100%)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundImage = 'none';
              }}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full lg:w-auto h-11 px-[17px] flex items-center justify-center rounded-md text-size-sm leading-[18.2px] tracking-[0.42px] text-white bg-white/15 border border-white/15 backdrop-blur-[2px] hover:bg-white/20 hover:border-white/20 disabled:hover:bg-white/15 disabled:hover:border-white/15 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {/* Success Message */}
          {successMessage && (
            <div className="absolute inset-0 flex items-center justify-center lg:justify-start w-full px-4 py-3 rounded-md bg-green-50 border border-green-200 animate-in fade-in duration-300">
              <p className="text-size-sm text-green-800 leading-[18.2px] font-medium">
                {successMessage}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="absolute inset-0 flex items-center justify-center lg:justify-start w-full px-4 py-3 rounded-md bg-red-50 border border-red-200 animate-in fade-in duration-300">
              <p className="text-size-sm text-red-800 leading-[18.2px] font-medium">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Decorative Icon - shown at 320px and 1024px+ */}
        <img
          src="/images/homepage/newsletter.svg"
          alt=""
          className="min-[680px]:hidden lg:block size-[140px] lg:absolute lg:top-10 lg:right-6 lg:size-64 2xl:top-6 2xl:right-12 2xl:size-[280px] opacity-80"
        />
      </div>
    </div>
  );
};

export default NewsletterBanner;
