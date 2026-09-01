import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expert.boardgames',
  appName: 'Swift',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scheme: 'Swift',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
};

export default config;
