const { getDefaultConfig } = require('expo/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');
const path = require('path');

const config = getDefaultConfig(__dirname);

module.exports = withTamagui(config, {
  config: path.join(__dirname, 'tamagui.config.ts'),
  components: [
    'tamagui',
    '@tamagui/button',
    '@tamagui/avatar',
    '@tamagui/switch',
    '@tamagui/form',
    '@tamagui/toast'
  ],
});
