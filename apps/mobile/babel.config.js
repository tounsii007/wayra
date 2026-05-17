module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
            '@wayra/types': '../../packages/types/src',
            '@wayra/shared': '../../packages/shared/src',
            '@wayra/i18n': '../../packages/i18n/src',
            '@wayra/ui': '../../packages/ui/src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
