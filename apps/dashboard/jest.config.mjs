export default {
  displayName: 'dashboard',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/dashboard',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleNameMapper: {
    '^@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data$':
      '<rootDir>/../../libs/data/src/index.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
};
