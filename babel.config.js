module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      './plugins/babel-plugin-transform-import-meta-env',
      'react-native-worklets/plugin',
    ],
  };
};