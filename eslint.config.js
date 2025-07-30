const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const myEslintRules = require('./my-eslint-rules.json');

module.exports = [
  // Base configuration
  js.configs.recommended,
  
  // TypeScript configuration for .ts files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        // Node.js globals
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // Webpack globals
        __WebpackModuleApi: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...myEslintRules.rules
    }
  },
  
  // JavaScript configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        Buffer: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    }
  },
  
  // Ignore patterns
  {
    ignores: [
      'webpack/**',
      'Gulpfile.js',
      'build/**',
      'dist/**',
      'node_modules/**'
    ]
  }
];