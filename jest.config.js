module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'dm4-*.js',
    '!dm4-dataset-main.js',
    '!dm4-runtime.js'
  ]
};
