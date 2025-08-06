import {
  Html, Head, Main, NextScript,
} from 'next/document';
import { inter, interDisplay } from '../lib/fonts';

const Document = () => {
  return (
    <Html className={`${inter.variable} ${interDisplay.variable}`}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
