import React, { useState } from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';

interface BannerProps {
  title: string;
  className?: string;
  inputPlaceholder?: string;
  buttonText?: string;
  showInput?: boolean;
  showButton?: boolean;
}

export const Banner: React.FC<BannerProps> = ({
  title, className, inputPlaceholder = 'you@example.com', // Default placeholder
  buttonText = 'Submit', // Default button text
  showInput = false, // Default to not show input
  showButton = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    alert('Thank you!');
    // TODO: Send the email to the backend
    setInputValue('');
  };

  return (
    <div className={clsx('banner relative w-full p-12 text-center rounded-lg bg-bluedot-lighter', className)}>
      <h1 className="banner__title text-bluedot-normal font-serif font-normal text-2xl">{title}</h1>
      <form onSubmit={handleSubmit} className="banner__form flex flex-row items-center justify-center gap-4 mt-6">
        {showInput && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            className="banner__input p-2 rounded border font-sans text-base font-normal text-center w-80"
          />
        )}
        {showButton && (
          <CTALinkOrButton className="banner__submit-btn rounded-lg" type="submit">
            {buttonText}
          </CTALinkOrButton>
        )}
      </form>
    </div>
  );
};

export default Banner;
