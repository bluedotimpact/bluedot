import { useEffect } from 'react';

export const CircleWidget = () => {
  useEffect(() => {
    // Check if script already exists
    if (document.getElementById('mw')) {
      return;
    }

    const script = document.createElement('script');
    script.innerHTML = `
      (function (w,d,s,o,f,js,fjs) {
          w['circleWidget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
          js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
          js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
      }(window, document, 'script', 'mw', 'https://community.bluedot.org/external/widget.js'));

      mw('init', {
          community_public_uid: 'e89480df',
          brand_color_dark: '#fffcf7',
          brand_color_light: '#0037ff',
          default_appearance: 'light'
      });
    `;

    try {
      document.body.appendChild(script);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to inject Circle widget script:', error);
    }

    try {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to remove Circle widget script:', error);
    }
  }, []);

  return null;
};
