import type { CapacitorConfig } from '@capacitor/cli';

const config = {
  appId: 'io.github.youngsplace.screenshotshield',
  appName: 'Screenshot Shield',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
} satisfies CapacitorConfig;

export default config;
