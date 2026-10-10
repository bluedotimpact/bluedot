import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: [
        'theme/index.ts',
        'theme/data/recoveryCodes.ts',
        'theme/data/webAuthnAuthenticate.ts',
        'theme/data/webAuthnRegister.ts',
      ],
      output: {
        assetFileNames: '[name][extname]',
        dir: 'theme/login/resources/dist',
        entryFileNames: '[name].js',
      },
    },
  },
});
