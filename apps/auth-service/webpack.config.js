const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { resolve, join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      // use resolve to connect paths into absolute paths containing aliases
      '@packages': resolve(__dirname, '../../packages'), // from webpack config go out 2 directories to find packages
    },
    extensions: ['.ts', '.js'], // extensions to resolve specific file types
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};
