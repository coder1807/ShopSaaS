import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  displayName: '@shop-saa-s/seller-ui',
  preset: '../../jest.preset.js',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/seller-ui',
  testEnvironment: 'jsdom',
};

export default createJestConfig(config);
