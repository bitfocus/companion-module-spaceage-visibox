import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

export default [
  ...(await generateEslintConfig({
    enableTypescript: true,
    ignores: ['**/.test-build/*'],
  })),
  {
    files: ['src/**/*.ts'],
    // esbuild inlines the API client into dist/main.js, so it is a
    // devDependency on purpose and never needed at runtime.
    rules: {
      'n/no-unpublished-import': [
        'error',
        { allowModules: ['@visibox/api-client'] },
      ],
    },
  },
]
