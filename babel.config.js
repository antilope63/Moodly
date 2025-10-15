module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          config: './tamagui.config.ts',
          components: [
            '@tamagui/button',
            '@tamagui/avatar',
            '@tamagui/switch',
            '@tamagui/form',
            '@tamagui/toast'
          ],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
