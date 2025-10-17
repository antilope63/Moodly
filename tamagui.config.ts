import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v4';

const config = createTamagui(defaultConfig);

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
