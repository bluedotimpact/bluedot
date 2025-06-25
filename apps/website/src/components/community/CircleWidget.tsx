import { useEffect } from 'react';

export const CircleWidget = () => {
  useEffect(() => {
    // Check if script already exists
    if (document.getElementById('front-chat-script')) {
      return;
    }

    // Create and append the Front Chat script
    const script = document.createElement('script');
    script.id = 'front-chat-script';
    script.src = 'https://chat-assets.frontapp.com/v1/chat.bundle.js';
    script.async = true;

    script.onload = () => {
      // Initialize Front Chat after the script has loaded
      window.FrontChat('init', {
        chatId: '9823fa57687fa42b5ccb5d8b8d2ff730',
        useDefaultLauncher: true,
      });
    };

    document.body.appendChild(script);
  }, []);

  return null;
};
