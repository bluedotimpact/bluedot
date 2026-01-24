import React, { useState } from 'react';
import clsx from 'clsx';
import { CTALinkOrButton } from './CTALinkOrButton';

export type BannerProps = {
  title: string;
  className?: string;
  inputPlaceholder?: string;
  buttonText?: string;
  showInput?: boolean;
  showButton?: boolean;
};

export const Banner: React.FC<BannerProps> = ({
  title, className, inputPlaceholder = 'you@example.com', // Default placeholder
  buttonText = 'Submit', // Default button text
  showInput = false, // Default to not show input
  showButton = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // eslint-disable-next-line no-alert
    alert('Thank you!');
    // TODO: Send the email to the backend
    setInputValue('');
  };

  return (
    <div className={clsx('banner relative w-full p-12 text-center rounded-lg bg-bluedot-lighter', className)}>
      <h3 className="banner__title font-[500] bluedot-h3">{title}</h3>
      <form onSubmit={handleSubmit} className="banner__form flex flex-row items-center justify-center gap-space-between mt-6">
        {showInput && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            className="banner__input p-2 rounded-sm border font-sans text-size-md font-normal text-center w-80"
          />
        )}
        {showButton && (
          <CTALinkOrButton className="banner__submit-btn" type="submit">
            {buttonText}
          </CTALinkOrButton>
        )}
      </form>
    </div>
  );
};

export default Banner;
