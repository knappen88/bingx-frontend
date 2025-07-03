import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marketshadows.bingx',
  appName: 'BingX Analytics',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    // ЗАМЕНИТЕ на ваш реальный URL с Netlify
    url: 'https://gleaming-belekoy-564756.netlify.app',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#111827'
  }
};

export default config;