import React, { useState } from 'react';
import clsx from 'clsx';

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
    console.log('Submitted value:', inputValue);
    // TODO: Send the email to the backend
    setInputValue('');
  };

  return (
    <div className={clsx('banner relative w-full p-5 text-center rounded-lg bg-bluedot-lighter', className)}>
      <h1 className="banner__title text-bluedot-normal font-serif font-normal">{title}</h1>
      <form onSubmit={handleSubmit} className="mt-4">
        {showInput && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={inputPlaceholder}
            className="p-2 rounded border font-sans text-base font-normal text-center w-80"
          />
        )}
        {showButton && (
          <button type="submit" className="ml-2 p-2 bg-bluedot-normal text-white font-bold rounded">
            {buttonText}
          </button>
        )}
      </form>
    </div>
  );
};

export default Banner;
