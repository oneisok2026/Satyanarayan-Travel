import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      // `npm run clean` builds into a timestamped directory when .next is
      // locked by an editor, so generated output must be ignored by pattern.
      '.next-build-*/**',
      '.next-stale-*/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // The logger is the one place allowed to reach the console directly.
    files: ['src/lib/logger.ts', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];

export default eslintConfig;
