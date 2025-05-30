import { useEffect } from 'react';

export const CircleWidget = () => {
  useEffect(() => {
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
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove the script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return null;
};
