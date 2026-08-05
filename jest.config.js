module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Coverage is scoped to the payments feature, which is held to 100%.
  collectCoverageFrom: [
    'components/payment/**/*.{ts,tsx}',
    'components/shared/FormField.tsx',
    'components/ask/LocationPickerModal.tsx',
    'components/shared/ActionSheet.tsx',
    'components/shared/useActionSheet.tsx',
    'app/wallet/**/*.{ts,tsx}',
    'app/ask/index.tsx',
    'services/payments.services.ts',
    'services/location.services.ts',
    'store/wallet.store.ts',
    'types/payment.types.ts',
    'utils/payment.utils.ts',
    'utils/review.utils.ts',
    'utils/useDebouncedValue.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
